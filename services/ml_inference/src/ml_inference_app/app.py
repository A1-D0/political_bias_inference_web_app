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
    This command can be run from anywhere during local development:
        ml-inference-service 

Author:
    Osvaldo Hernandez-Segura

Date Created:
    January 20, 2026

Date Modified:
    April 24, 2026

References:
    Copilot, ChatGPT, Flask documentation
"""
import os
import joblib
import torch
import pandas as pd
import time
import json
import secrets

from flask import Flask, jsonify, request, g
from dotenv import load_dotenv
from datetime import datetime, timezone
from pathlib import Path
from ml_inference_app.schemas.prediction_schema import PredictRequestBodySchema, PredictRequestHeadersSchema
from pydantic import ValidationError

# load environment variables from .env file
# note that this allows subfiles to access the same environment variables
# as this main app.py file
load_dotenv()

from utils.data_preprocessing import TokenizerSentenceTransformer
from ml_inference_app.middleware.internal_auth import internal_api_key_verification

# get start time for uptime calculation
START_TIME = time.time()
SERVICE_NAME = "ml-service"

def emit_log(level: str, event: str, **fields):
    """
    Emits compact structured JSON to stdout for platform log collection.

    The log entry includes a timestamp, log level, service name, event type, 
    and any additional fields provided. The JSON is compacted to minimize size.

    Args:
        level (str): The log level (e.g., "info", "error").
        event (str): A short string describing the event type.
        **fields: Additional key-value pairs to include in the log entry.
    """
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "level": level,
        "service": SERVICE_NAME,
        "event": event,
    }
    payload.update(fields)
    print(json.dumps(payload, separators=(",", ":")), flush=True)

def get_request_latency_ms() -> float:
    """
    Returns total elapsed request time in milliseconds when request timing exists.

    Returns:
        latency_ms (float): The total latency of the request in milliseconds, 
        calculated as the difference between the current time and the time when the 
        request started. If the request start time is not available, it returns 0.
    """
    return (time.perf_counter() - getattr(g, "request_started_at", time.perf_counter())) * 1000

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
DEBUG_MODE = int(os.getenv("DEBUG_MODE", 0)) == 1  # Default to 0 (False) if not set

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
    emit_log("info", "inference_runtime_selected", runtime_device="gpu")
else:
    emit_log("info", "inference_runtime_selected", runtime_device="cpu")
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

# Extract version from filename, e.g., "linear_svc_pipeline_v1"
MODEL_VERSION = MODEL_FILE.split(".")[0]  
LABEL_ENCODER_VERSION = LABLE_ENCODER_FILE.split(".")[0]

app = Flask(__name__)

emit_log("info", "server_started", host=HOST, port=PORT)

# --------- END OF CONFIGURATION AND SETUP ---------

# ---------- START OF API MIDDLEWARE ----------

@app.before_request
def setup_request_context():
    """
    Initializes request-scoped metadata for structured logging.

    Reuses an incoming X-Request-Id or generates one locally, then logs only
    safe request metadata such as text length and request body size.
    """
    if request.endpoint != "predict":
        return

    request_id = (request.headers.get("X-Request-Id") or "").strip()
    if not request_id:
        request_id = f"req_{secrets.token_hex(6)}"

    g.request_id = request_id
    g.request_started_at = time.perf_counter()

    raw_body = request.get_data(cache=True, as_text=False) or b""
    payload = request.get_json(silent=True) or {}
    text = payload.get("text")
    text_length = len(text) if isinstance(text, str) else 0

    emit_log(
        "info",
        "inference_request_received",
        request_id=request_id,
        text_length_chars=text_length,
        request_body_bytes=len(raw_body),
    )

@app.before_request
def predict_endpoint_input_validation():
    """
    Middleware to validate input for the /predict endpoint before processing the request.

    Returns:
        A Flask response with an error message and a 400 status code if validation fails,
        or None to continue processing the request if validation succeeds.
    """
    if request.endpoint != "predict":
        return # Skip validation for non-predict endpoints
    try:
        PredictRequestHeadersSchema(
                content_type=request.headers.get("Content-Type"),
                x_internal_api_key=request.headers.get("X-Internal-API-Key"))
        request_data = (request.get_json(force=True, silent=True) or {})
        PredictRequestBodySchema(**request_data)
    except ValidationError as e:
        return jsonify({"error": f"Input validation failed: {str(e)}"}), 400

@app.before_request
def require_internal_api_key():
    """
    Middleware to require internal API key verification for all endpoints
    except the health check.
    """
    if request.endpoint != "health_check":
        api_key_check = internal_api_key_verification()

        # return error response if API key is invalid
        # Note: do not change this logic because there is no
        # other clever way to handle validated API keys from the request headers
        if api_key_check is not True: 
            return api_key_check  

# ---------- END OF API MIDDLEWARE ----------

@app.after_request
def attach_request_id_header(response):
    """
    Attaches the request id to responses when present.

    Args:
        response: The Flask response object to which the X-Request-Id header will be added if a request ID is present in the request context.

    Returns:
        The modified Flask response object with the X-Request-Id header if a request ID is present, or the original response if not.
    """
    request_id = getattr(g, "request_id", None)
    if request_id:
        response.headers["X-Request-Id"] = request_id
    return response

# ---------- START OF API ENDPOINTS ----------

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
    Note that the input validation for this endpoint is handled by the predict_endpoint_input_validation middleware.

    Returns:
        A Flask response containing the predicted label in JSON format or an
        error message with appropriate status code.
    """
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()

    # prepare input data
    input_data = pd.DataFrame({"text": [text]}) 

    # perform prediction
    try:
        # Track model inference separately from total request latency
        inference_started_at = time.perf_counter()
        output = model.predict(input_data)
        output_label = label_encoder.inverse_transform(output)
        inference_latency_ms = (time.perf_counter() - inference_started_at) * 1000

        # change wording of the "least" output label, if applicable
        if output_label[0] == "least":
            output_label[0] = "center"

        emit_log(
            "info",
            "inference_completed",
            request_id=getattr(g, "request_id", "unknown"),
            inference_latency_ms=round(inference_latency_ms, 3),
            total_latency_ms=round(get_request_latency_ms(), 3),
            model_version=MODEL_VERSION,
            prediction_label=output_label[0],
        )

        return jsonify({"prediction": output_label[0],
                        "model_version": MODEL_VERSION, 
                        "label_encoder_version": LABEL_ENCODER_VERSION
                        }), 200
    except Exception as e:
        emit_log(
            "error",
            "inference_failed",
            request_id=getattr(g, "request_id", "unknown"),
            total_latency_ms=round(get_request_latency_ms(), 3),
            error_type=type(e).__name__,
            error_message=str(e),
        )
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

# ---------- END OF API ENDPOINTS ----------

def main():
    if not DEBUG_MODE:
        return
    app.run(host=HOST,
            port=PORT,
            debug=DEBUG_MODE)

if __name__ == "__main__":
    main()
