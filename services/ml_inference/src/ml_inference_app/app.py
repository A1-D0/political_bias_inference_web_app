"""
Description:
    This script implements a Flask API for serving a machine learning model
    that predicts political bias from text input. It includes endpoints for
    health checks and predictions. The model and label encoder are loaded
    from specified file paths, and the predict API handles input validation 
    and error reporting.

How to run:
    Ensure the necessary environment variables are set through a .env file,
    and that you have install the ml_inference_app module using pip install -e . 
    from the root directory of the project. 
    This command can be run from anywhere: ml-inference-service 

Author:
    Osvaldo Hernandez-Segura

Date Created:
    January 20, 2026

Date Modified:
    February 8, 2026

References:
    Copilot, ChatGPT, Flask documentation
"""
import os
import joblib
import torch
import pandas as pd
import time

from flask import Flask, jsonify, request
from dotenv import load_dotenv
from datetime import datetime, timezone
from pathlib import Path

# load environment variables from .env file
# note that this allows subfiles to access the same environment variables
# as this main app.py file
load_dotenv()

from utils.data_preprocessing import TokenizerSentenceTransformer
from ml_inference_app.middleware.internal_auth import internal_api_key_verification

# get start time for uptime calculation
START_TIME = time.time()

# --------- START OF CONFIGURATION AND SETUP ---------
# add environmental variables for model and label encoder paths, 
# with validation and a default value
HERE = Path(__file__).resolve().parent
ROOT = APP_BASE = HERE.parent.parent

def resolve_dir(dir_value: str | None, default: Path) -> Path:
    """
    Resolves a directory path from an environment variable, ensuring it is absolute.

    Args:
        dir_value (str | None): The directory path from the environment variable.
        default (Path): The default path to use if dir_value is not provided.

    Returns:
        The resolved absolute Path object for the directory.
    """
    if not dir_value:
        return default
    p = Path(dir_value)
    return p if p.is_absolute() else (APP_BASE / p)

MODELS_DIR = resolve_dir(os.getenv("MODELS_DIR"), ROOT / "models")
MODEL_FILE = os.getenv("MODEL_FILE")
LABLE_ENCODER_FILE = os.getenv("LABEL_ENCODER_FILE")

if not MODEL_FILE:
    raise RuntimeError("MODEL_FILE environment variable is not set.")
if not LABLE_ENCODER_FILE:
    raise RuntimeError("LABEL_ENCODER_FILE environment variable is not set.")

# read environment variables
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 5000))

# adjust torch device for TokenizerSentenceTransformer
# before loading the model
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

# load the model and label encoder
MODEL_PATH = MODELS_DIR / MODEL_FILE
LABEL_ENCODER_PATH = MODELS_DIR / LABLE_ENCODER_FILE
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise ValueError(f"Failed to load model from {MODEL_PATH}: {str(e)}")

try:
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
except Exception as e:
    raise ValueError(f"Failed to load label encoder from {LABEL_ENCODER_PATH}: {str(e)}")

app = Flask(__name__)

print(f"ML Inference Service is running on http://{HOST}:{PORT}")
# --------- END OF CONFIGURATION AND SETUP ---------

# ---------- START OF API ENDPOINTS ----------

@app.before_request
def require_internal_api_key():
    """
    Middleware to require internal API key verification for all endpoints
except the health check.
    """
    if request.endpoint != "health_check":
        api_key_check = internal_api_key_verification()

        # return error response if API key is invalid
        if api_key_check is not True:
            return api_key_check  

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify that the service is running.

    Returns:
        A Flask response indicating the service status in JSON format.
    """
    UPTIME_SECONDS = int(time.time() - START_TIME)
    try:
        utc_now = datetime.now(timezone.utc)
        utc_now = utc_now.isoformat()
    except Exception:
        utc_now = "unavailable"

    return jsonify({"status": "ok", 
                    "port": os.getenv("PORT"),
                    "service": "ml_inference",
                    "uptime_seconds": UPTIME_SECONDS,
                    "utc_now": utc_now}), 200

@app.post("/predict")
def predict():
    """
    Predicts the political bias of the input text using the pre-loaded model.

    Returns:
        A Flask response containing the predicted label in JSON format or an
        error message with appropriate status code.
    """
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "No text provided for prediction."}), 400
    elif not isinstance(text, str):
        return jsonify({"error": "Input text must be a string."}), 400

    # prepare input data
    input_data = pd.DataFrame({"text": [text]}) 

    # perform prediction
    try:
        output = model.predict(input_data)
        output_label = label_encoder.inverse_transform(output)

        # change wording of the "least" output label, if applicable
        if output_label[0] == "least":
            output_label[0] = "center"

        return jsonify({"prediction": output_label[0]}), 200
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

# ---------- END OF API ENDPOINTS ----------
def main():
    app.run(host=HOST,
            port=PORT,
            debug=True)

if __name__ == "__main__":
    main()
