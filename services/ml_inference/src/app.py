"""
Description:
    This script implements a Flask API for serving a machine learning model
    that predicts political bias from text input. It includes endpoints for
    health checks and predictions. The model and label encoder are loaded
    from specified file paths, and the predict API handles input validation 
    and error reporting.

How to run:
    Ensure you are in the src/ directory where app.py is located. 
    Then run: python app.py

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

# load environment variables from .env file
# note that this allows subfiles to access the same environment variables
# as this main app.py file
load_dotenv()

from utils.data_preprocessing import TokenizerSentenceTransformer
from middleware.internal_auth import internal_api_key_verification 

# get start time for uptime calculation
START_TIME = time.time()

# read environment variables
# environment variables reference:
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 5000))
MODEL_PATH = os.getenv("MODEL_PATH")
LABEL_ENCODER_PATH = os.getenv("LABEL_ENCODER_PATH") 

# validate required environment variables
if not MODEL_PATH:
    raise ValueError("MODEL_PATH environment variable is not set.")
if not LABEL_ENCODER_PATH:
    raise ValueError("LABEL_ENCODER_PATH environment variable is not set.")

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

if __name__ == "__main__":
    app.run(host=HOST,
            port=PORT,
            debug=True)
