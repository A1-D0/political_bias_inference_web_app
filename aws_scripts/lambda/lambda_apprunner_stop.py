"""
Description:
    This script is an AWS Lambda function designed to pause AWS App Runner services.
    It reads a list of App Runner service ARNs from the SERVICE_ARNS environment variable,
    which is expected to be a JSON list of strings. The function then attempts to pause each
    service using the App Runner API. If a service is already in a state that cannot be paused,
    the function will handle the InvalidStateException gracefully and include a note in the results.

How to Run:
    This Lambda function is intended to be deployed in AWS Lambda. To use it, you need
    to set the SERVICE_ARNS environment variable to a JSON list of App Runner service ARNs that you want to pause.
    For example:
        SERVICE_ARNS='["arn:aws:apprunner:us-east-1:123456789012:service/my-service-1/abcdef123456", 
                       "arn:aws:apprunner:us-east-1:123456789012:service/my-service-2/abcdef123456"]'

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
from typing import Any, Dict, List

import boto3
from botocore.exceptions import ClientError

REGION = os.environ.get("AWS_REGION", "us-east-1")
apprunner = boto3.client("apprunner", region_name=REGION)

def load_arns() -> List[str]:
    """
    Expects SERVICE_ARNS env var to be a JSON list of App Runner service ARNs to pause.

    Returns:
        List[str]: The list of App Runner service ARNs to pause.

    Raises:
        RuntimeError: If SERVICE_ARNS is missing, not a valid JSON list, or empty.
    """
    raw = os.environ.get("SERVICE_ARNS", "[]")
    arns = json.loads(raw)
    if not isinstance(arns, list) or not arns:
        raise RuntimeError("SERVICE_ARNS must be a non-empty JSON list")
    return arns

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler to pause App Runner services specified in the SERVICE_ARNS environment variable.

    Args:
        event (Dict[str, Any]): The event data passed to the Lambda function.
        context (Any): The context in which the Lambda function is called.

    Returns:
        Dict[str, Any]: A dictionary containing the results of the pause operations for each service ARN.

    Raises:
        ClientError: If an error occurs while calling the App Runner API, 
        except for InvalidStateException which is handled gracefully.
    """
    results = []
    for arn in load_arns():
        try:
            apprunner.pause_service(ServiceArn=arn)
            results.append({"service_arn": arn, "paused": True})
        except ClientError as e:
            # If the service is already paused or in a state that cannot be paused, we handle it gracefully    
            if e.response.get("Error", {}).get("Code") == "InvalidStateException":
                results.append({"service_arn": arn, "paused": False, "note": "InvalidStateException"})
            else:
                raise
    return {"ok": True, "results": results}

