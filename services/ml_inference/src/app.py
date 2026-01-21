"""
Description:

Author:
    Osvaldo Hernandez-Segura

Date Created:
    January 20, 2026

Date Modified:
    January 20, 2026

References:
    Copilot, ChatGPT, Flask documentation
"""

"""
ML INFERENCE REFERENCE IMPLEMENTATION

import argparse
import math
import pandas as pd
import joblib
import torch

from datasets import load_dataset
from types import SimpleNamespace
from itertools import islice

# to comply with the imported model's dependencies
from utils.data_preprocessing import TokenizerSentenceTransformer

def perform_inference(model, data: pd.DataFrame) -> pd.DataFrame: 
    Performs inference using the provided ML model on the given dataset.

    Args:
        model: The pre-trained ML model with scikit-learn pipeline.
        data (pd.DataFrame): The input dataset for inference.

    Returns:
        pd.DataFrame: The inference results including predictions and confidence scores, if applicable.
    print("Performing inference...")
    results = model.predict(data)
    if hasattr(model, "decision_function"):
        print("Calculating confidence scores...")
        confidences = model.decision_function(data)
        results = pd.DataFrame({
            'predictions': results,
            'confidence_scores': confidences.max(axis=1)
            })
    else: 
        print("Model does not support confidence scoring; skipping.")
        results = pd.DataFrame({
            'predictions': results
            })
    return results

def get_data(sample_size: float = 1.0):
    Loads the Hugging Face dataset and samples it if required.

    Args:
        sample_size (float): Fraction of the dataset to sample.

    Returns:
        pd.DataFrame: The loaded (and possibly sampled) dataset as a DataFrame.
    if sample_size <= 0.0 or sample_size > 1.0:
        raise ValueError("sample_size must be between 0 (exclusive) and 1 (inclusive).")
    dataset = load_dataset("rjac/all-the-news-2-1-Component-one",
                           split="train", 
                           streaming=True)

    # 2 million samples in full dataset
    N = math.floor((2 * (10**6)) * sample_size)
    sampled_data = list(islice(dataset, N))
    df = pd.DataFrame(sampled_data)
    return df

def get_parser() -> argparse.ArgumentParser:
    Creates the argument parser for the script.

    Returns:
        argparse.ArgumentParser: The argument parser.
    parser = argparse.ArgumentParser(description="ML Baseline Inference for US News Articles")
    parser.add_argument('-ml', '--model_path', type=str, required=True, 
                        help='Path to the pre-trained baseline ML model.')
    parser.add_argument('-l', '--label_encoder', type=str, required=True,
                        help='Path to the label encoder used during model training to get ordinal labels.')
    parser.add_argument('-o', '--output_data', type=str, required=True,
                        help='Path to save the inference results.')
    parser.add_argument('-s', '--sample_size', type=float, required=False, default=1.0,
                        help='Number of samples to process for testing purposes.')
    return parser

def get_args(parser: argparse.ArgumentParser): 
    Parses the command line arguments.

    Args:
        parser (argparse.ArgumentParser): The argument parser.

    Returns:
        SimpleNamespace: The parsed arguments as a SimpleNamespace object.
    print("Parsing command line arguments...")
    args = parser.parse_args()
    deliverable = SimpleNamespace()
    for key, value in vars(args).items():
        setattr(deliverable, key, value)
    return deliverable 

def main() -> None:
    parser = get_parser()
    args = get_args(parser)

    # read input data
    try:
        print("Loading data...")
        data = get_data(sample_size=args.sample_size)
        data = data[["article"]]

        # rename data column 'article' -> 'text'
        # for ML pipeline compatibility
        data.rename(columns={"article": "text"}, inplace=True)
    except Exception as e:
        print(f"Error loading data: {e}")
        raise e

    # adjust torch device for TokenizerSentenceTransformer
    device_is_cuda = torch.cuda.is_available()
    if device_is_cuda:
        print("CUDA device detected. Using GPU for inference.")
    else:
        print("No CUDA device detected. Using CPU for inference.")
        _original_torch_load = torch.load
        def cpu_torch_load(*args, **kwargs):
            kwargs["map_location"] = torch.device("cpu")
            return _original_torch_load(*args, **kwargs)

        torch.load = cpu_torch_load

    # load ml pipeline 
    model = joblib.load(args.model_path)

    # perform inference and confidence scoring, if applicable
    results = perform_inference(model, data)
    has_confidence = 'confidence_scores' in results.columns

    # load label encoder to get ordinal labels
    label_encoder = joblib.load(args.label_encoder)

    # print results
    print("Inference results:")
    results["predictions"] = label_encoder.inverse_transform(results["predictions"])
    print(results["predictions"].head())
    if has_confidence:
        print("Confidence scores:")
        print(results["confidence_scores"].head())

    # save results to output file
    with open(args.output_data, 'w') as f:
        results.to_string(f, index=False)
    print(f"Inference results saved to {args.output_data}")

if __name__ == "__main__":
    main()
    exit(0)
"""

import os
import joblib
import torch

from flask import Flask, jsonify, request
from dotenv import load_dotenv
from utils.data_preprocessing import TokenizerSentenceTransformer

# load environment variables from .env file
load_dotenv()

# read environment variables
# environment variables reference:
# PORT=
# HOST=
# MODEL_PATH=
# LABEL_ENCODER_PATH=
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 5000))
MODEL_PATH = os.getenv("MODEL_PATH")
LABEL_ENCODER_PATH = os.getenv("LABEL_ENCODER_PATH") 

if not MODEL_PATH:
    raise ValueError("MODEL_PATH environment variable is not set.")
if not LABEL_ENCODER_PATH:
    raise ValueError("LABEL_ENCODER_PATH environment variable is not set.")

# model = joblib.load(MODEL_PATH)
# label_encoder = joblib.load(LABEL_ENCODER_PATH)

app = Flask(__name__)

@app.get("/health")
def health_check():
    return jsonify({"status": "ok", 
                    "port": os.getenv("PORT"),
                    "service": "ml_inference"}), 200

# @app.post("/predict")
# def predict():
#     pass

if __name__ == "__main__":
    # read environment variables
    app.run(host=HOST,
            port=PORT,
            debug=True)
