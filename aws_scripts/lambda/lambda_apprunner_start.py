"""
Description:
    This script is an AWS Lambda function designed to start AWS App Runner services.
    It reads a list of service configurations from the SERVICE_CONFIG environment variable,
    which is expected to be a JSON list of dictionaries. Each dictionary should contain the name
    of the service, the ARN of the App Runner service to update, the URI of the ECR repository, 
    and the tag to deploy.

    The function performs the following steps for each service (instance) configuration:
    1. Resumes the service if it is currently PAUSED, since UpdateService calls are 
       not allowed while the service is PAUSED.
    2. Waits until the service status is no longer PAUSED.
    3. Determines the latest image digest for the specified ECR repository and tag.
    4. Updates the App Runner service to deploy the new image identifier using the digest, 
       which forces a new revision if the tag content has changed.
    5. Waits for the deployment to settle and the service to be in a stable state (e.g., RUNNING).
    6. Collects the results of the operations for each service and returns a summary.

How to Run:
    This Lambda function is intended to be deployed in AWS Lambda. To use it, you need
    to set the SERVICE_CONFIG environment variable to a JSON list of service configurations. 
    Each configuration should be a dictionary with the following keys:
    - service_arn: The ARN of the App Runner service to update and start.
    - ecr_repo_uri: The full URI of the ECR repository (e.g. 123.dkr.ecr.us-east-1.amazonaws.com/my-repo).
    - tag: The tag to deploy (e.g. prod).
    For example:
        SERVICE_CONFIG='[
            {
                "name": "my-service-1",
                "service_arn": "arn:aws:apprunner:us-east-1:123456789012:service/my-service-1/abcdef123456",
                "ecr_repo_uri": "123.dkr.ecr.us-east-1.amazonaws.com/my-repo",
                "tag": "prod"
            },
            {
                "name": "my-service-2",
                "service_arn": "arn:aws:apprunner:us-east-1:123456789012:service/my-service-2/abcdef123456",
                "ecr_repo_uri": "123.dkr.ecr.us-east-1.amazonaws.com/my-repo",
                "tag": "prod"
            }
        ]'

Author:
    Osvaldo Hernandez-Segura

Date Created:
    March 4, 2026

Date Modified:
    March 5, 2026

References:
    Copilot, ChatGPT
"""

import json
import os
import time
import boto3

from typing import Any, Dict, List

REGION = os.environ.get("AWS_REGION", "us-east-1")

# Wait settings for App Runner non-PAUSED state (tune if needed)
WAIT_INTERVAL_SECONDS = int(os.environ.get("WAIT_INTERVAL_SECONDS", "3"))
WAIT_TIMEOUT_SECONDS = int(os.environ.get("WAIT_TIMEOUT_SECONDS", "120"))

apprunner = boto3.client("apprunner", region_name=REGION)
ecr = boto3.client("ecr", region_name=REGION)

# -----------------------------
# Config
# -----------------------------
def load_cfg() -> List[Dict[str, str]]:
    """
    Expects SERVICE_CONFIG env var to be a JSON list of dicts with keys:
        - name (optional but recommended): label for logs/results
        - service_arn: App Runner service ARN
        - ecr_repo_uri: full ECR repo URI (e.g. 123.dkr.ecr.us-east-1.amazonaws.com/my-repo)
        - tag: tag to deploy (e.g. prod)

    Returns: 
        List[Dict[str, str]]: The parsed configuration list.

    Raises:
        RuntimeError: If SERVICE_CONFIG is missing, not a valid JSON list, empty, or if any item is missing required keys.
    """
    raw = os.environ.get("SERVICE_CONFIG")
    if not raw:
        raise RuntimeError("Missing SERVICE_CONFIG env var")

    cfg = json.loads(raw)
    if not isinstance(cfg, list) or not cfg:
        raise RuntimeError("SERVICE_CONFIG must be a non-empty JSON list")

    for item in cfg:
        for k in ("service_arn", "ecr_repo_uri", "tag"):
            if k not in item:
                raise RuntimeError(f"Missing '{k}' in item: {item}")
        # name is optional; set default if absent
        if "name" not in item:
            item["name"] = item["service_arn"].split("/")[-1]

    return cfg

# -----------------------------
# ECR helpers
# -----------------------------
def parse_repo_name(ecr_repo_uri: str) -> str:
    """
    Parses the repository name from a full ECR repository URI.
    For example, given "123.dkr.ecr.us-east-1.amazonaws.com/my-repo", it returns "my-repo".

    Args:
        ecr_repo_uri (str): The full URI of the ECR repository.

    Returns:
        str: The repository name extracted from the URI.
    """
    return ecr_repo_uri.split("/")[-1]

def latest_digest_for_tag(repo_name: str, tag: str) -> str:
    """
    Retrieves the latest image digest for a given ECR repository and tag.

    Args:
        repo_name (str): The name of the ECR repository.
        tag (str): The image tag to look up.

    Returns:
        str: The image digest corresponding to the specified repository and tag.

    Raises:
        RuntimeError: If no image details or digest are found for the specified repository and tag.
    """
    resp = ecr.describe_images(
            repositoryName=repo_name,
            imageIds=[{"imageTag": tag}],
            )
    details = resp.get("imageDetails", [])
    if not details or not details[0].get("imageDigest"):
        raise RuntimeError(f"No digest found for ECR repo '{repo_name}' tag '{tag}'")
    return details[0]["imageDigest"]

# -----------------------------
# App Runner helpers
# -----------------------------
def describe_service(service_arn: str) -> Dict[str, Any]:
    """
    Retrieves the details of an App Runner service given its ARN.

    Args:
        service_arn (str): The ARN of the App Runner service to describe.

    Returns:
        Dict[str, Any]: A dictionary containing the details of the App Runner service.
    """
    return apprunner.describe_service(ServiceArn=service_arn)["Service"]

def resume_if_paused(service_arn: str) -> None:
    """
    If the App Runner service is currently PAUSED, this function will resume it.
    UpdateService calls are not allowed while the service is PAUSED, so this function ensures
    that the service is in a state that allows updates.

    Args:
        service_arn (str): The ARN of the App Runner service to check and potentially resume.
    """
    status = describe_service(service_arn).get("Status")
    if status == "PAUSED":
        apprunner.resume_service(ServiceArn=service_arn)

def wait_until_status(service_arn: str, desired: str) -> str:
    """
    Wait until the App Runner service reaches a specific status (e.g., RUNNING).
    Returns the final status.

    Args:
        service_arn (str): The ARN of the App Runner service to monitor.
        desired (str): The desired status to wait for (e.g., "RUNNING").

    Returns:
        str: The status of the App Runner service once it reaches the desired status.

    Raises:
        TimeoutError: If the service does not reach the desired status within the specified timeout period.
    """
    deadline = time.time() + WAIT_TIMEOUT_SECONDS
    last_status = None

    while time.time() < deadline:
        last_status = describe_service(service_arn).get("Status")
        if last_status == desired:
            return str(last_status)
        time.sleep(WAIT_INTERVAL_SECONDS)

    raise TimeoutError(
            f"Timeout waiting for status='{desired}'. Last status='{last_status}'. Arn={service_arn}"
            )

def wait_until_updatable(service_arn: str) -> str:
    """
    UpdateService fails while PAUSED or OPERATION_IN_PROGRESS.
    The safe target state to update from is typically RUNNING.

    Args:
        service_arn (str): The ARN of the App Runner service to monitor.

    Returns:
        str: The status of the App Runner service once it is in a state that allows updates (e.g., RUNNING).
    """
    return wait_until_status(service_arn, "RUNNING")

def update_service_image_identifier(service_arn: str, new_image_identifier: str) -> None:
    """
    Updates the App Runner service to deploy a new image identifier. This forces a 
    new revision if the tag content has changed.

    Args:
        service_arn (str): The ARN of the App Runner service to update.
        new_image_identifier (str): The new image identifier to deploy (e.g., "123.dkr.ecr.us-east-1.amazonaws.com/my-repo@sha256:abcdef123456").
    """
    svc = describe_service(service_arn)
    src = svc.get("SourceConfiguration") or {}
    img_repo = src.get("ImageRepository") or {}

    img_repo["ImageIdentifier"] = new_image_identifier

    apprunner.update_service(
            ServiceArn=service_arn,
            SourceConfiguration={
                "ImageRepository": img_repo,
                "AutoDeploymentsEnabled": False,
                })

# -----------------------------
# Lambda handler
# -----------------------------
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler to start App Runner services specified in the SERVICE_CONFIG environment variable.
    For each service configuration, it ensures the service is not PAUSED, waits until it is updatable,
    determines the latest image digest for the specified ECR repository and tag, updates the service to
    deploy the new image, and waits for the deployment to settle.

    Args:
        event (Dict[str, Any]): The event data passed to the Lambda function.
        context (Any): The context in which the Lambda function is called.

    Returns:
        Dict[str, Any]: A dictionary containing the results of the start operations for each service configuration.
    """
    cfg = load_cfg()
    results = []

    for item in cfg:
        name = item["name"]
        service_arn = item["service_arn"]
        ecr_repo_uri = item["ecr_repo_uri"]
        tag = item["tag"]

        # 1. Ensure service is not PAUSED
        resume_if_paused(service_arn)

        # 2. Ensure service is stable and updatable (not OPERATION_IN_PROGRESS)
        status_before_update = wait_until_updatable(service_arn)

        # 3. Determine newest digest for repo:tag
        repo_name = parse_repo_name(ecr_repo_uri)
        digest = latest_digest_for_tag(repo_name, tag)

        # 4. Deploy by digest (forces new revision when tag content changes)
        new_image_identifier = f"{ecr_repo_uri}@{digest}"

        # 5. UpdateService (deploy)
        update_service_image_identifier(service_arn, new_image_identifier)

        # 6. Wait for deployment to settle
        status_after_update = wait_until_updatable(service_arn)

        results.append(
                {
                    "name": name,
                    "service_arn": service_arn,
                    "status_before_update": status_before_update,
                    "deployed_image_identifier": new_image_identifier,
                    "status_after_update": status_after_update,
                    })

    return {"ok": True, "results": results}

