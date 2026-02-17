'''
Description:
    This script is designed to download model artifacts from an S3 bucket. 
    It takes the bucket name, prefix, and output directory as command-line arguments, 
    validates them, and then uses the boto3 library to interact with AWS S3 to 
    download the specified model artifacts.
    Note that that before running this program, AWS credentials must be configured 
    on the machine where this script is executed. On AWS App Runner, however,
    there is no need for this; the service will automatically use the IAM role associated 
    with the App Runner service to access S3.

How to Run:
    python download_model_artifacts.py --bucket <S3 MODEL BUCKET> \ 
    --prefix <S3 MODEL PREFIX> --output_dir <LOCAL OUTPUT DIRECTORY> 

    --bucket (-b): The name of the S3 bucket where the model artifacts are stored.
    --prefix (-p): The prefix in the S3 bucket that points to the model artifacts.
    --output_dir (-o): The local directory where the downloaded model artifacts will be saved locally.

    Example, run from the web_app/ directory:
        python download_model_artifacts.py -b us-news-bias-models \
        -p models -o src/ml_inference_app/models

    Note: The output path injected into this script is relative to this script's location, 
        so the output directory should be specified accordingly.

Author:
    Osvaldo Hernandez-Segura

Date Created:
    February 14, 2026

Date Modified:
    February 16, 2026

References:
    Copilot, ChatGPT, boto3 documentation
'''

import os
import sys
import boto3
import argparse

from botocore.exceptions import ClientError, NoCredentialsError

def get_parser()-> argparse.ArgumentParser:
    """
    Creates an argument parser for downloading model artifacts from S3.

    Returns:
        argparse.ArgumentParser: The argument parser for the script.
    """
    parser = argparse.ArgumentParser(description="Download model artifacts from S3")
    parser.add_argument("--bucket", "-b", required=True, help="S3 bucket name")
    parser.add_argument("--prefix", "-p", required=True, help="S3 prefix for the model artifacts")
    parser.add_argument("--output_dir", "-o", required=True, help="Local path to save the downloaded artifact")
    return parser

def validate_args(args) -> None:
    """
    Validates the command-line arguments for downloading model artifacts from S3.

    Args:
        args (argparse.Namespace): The parsed command-line arguments.

    Raises:
        SystemExit: If any of the required arguments are missing or if the output directory does not exist.
    """
    if not args.bucket:
        print("Error: S3 bucket name is required.")
        sys.exit(1)
    if not args.prefix:
        print("Error: S3 prefix is required.")
        sys.exit(1)
    if not args.output_dir:
        print("Error: Output directory is required.")
        sys.exit(1)
    if not os.path.exists(args.output_dir):
        # A path is not made if it does not exist because of the
        # fixed model paths required by the ml_inference_app 
        print(f"Error: Output directory '{args.output_dir}' does not exist.")
        sys.exit(1)

def download_model_artifacts(bucket_name: str, prefix: str, output_dir: str) -> None:
    s3 = boto3.client('s3')

    # Print available models in s3 that will be downloaded
    keys = []
    try:
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if 'Contents' in response:
            print(f"Found the following model artifacts in bucket '{bucket_name}' with prefix '{prefix}':")
            for number, obj in enumerate(response['Contents']):
                if number == 0:
                    # Skip the first file in the list because it is the prefix itself and not an actual file
                    continue
                print(f"{number}. {obj['Key']}")
                keys.append(obj['Key'])
        else:
            print(f"No model artifacts found in bucket '{bucket_name}' with prefix '{prefix}'.")
            sys.exit(1)
    except ClientError as e:
        print(f"Error: Unable to list objects in bucket '{bucket_name}' with prefix '{prefix}'. {e}")
        print("Please configure your AWS credentials and ensure you have the necessary permissions to access the bucket.")
        sys.exit(1)

    # Download the model artifacts from S3
    # but ensure to skip downloading if the file already exists in the output directory
    for key in keys:
        file_name = os.path.basename(key)
        local_path = os.path.join(output_dir, file_name)
        if os.path.exists(local_path):
            print(f"File '{local_path}' already exists. Skipping download for {key}.")
            continue
        try:
            print(f"Downloading '{key}' from '{bucket_name}' to '{local_path}'...")
            s3.download_file(bucket_name, key, local_path)
            print(f"Downloaded '{key}'.")
        except ClientError as e:
            print(f"Error: Unable to download '{key}' from '{bucket_name}'. {e}")
            sys.exit(1)

def main()-> None:
    # Get command-line arguments
    parser = get_parser()
    args = parser.parse_args()
    validate_args(args)
    BUCKET_NAME = args.bucket
    PREFIX = args.prefix.rstrip("/") + "/" # Remove trailing slash if present

    # Download model artifacts from S3
    download_model_artifacts(bucket_name=BUCKET_NAME, 
                             prefix=PREFIX, 
                             output_dir=args.output_dir)

if __name__ == "__main__":
    main()
    exit(0)
