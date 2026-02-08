"""
Description:
    This configuration file sets up the testing environment for the Flask API
    that serves a machine learning model. It configures the necessary environment
    variables to point to test-specific resources, ensuring that the tests run
    in an isolated environment without affecting production data or models.

How to run:
    Note: Make sure to run execute this command from the root directory of the project:
        i.e., us_news_web/services/ml_inference/
    python -m pytest -vv -s

Author:
    Osvaldo Hernandez-Segura

Date Created:
    January 26, 2026

Date Modified:
    February 8, 2026

References:
    Copilot, ChatGPT, Flask documentation
"""
import sys
from pathlib import Path
import os

# Add the root directory to sys.path
# This is to ensure that imports from the src directory work correctly
ROOT = Path(__file__).resolve().parents[1]

# Relative paths based on the location of the test files given the ROOT directory
# These environment variables must be set before importing the app 
os.environ.setdefault("INTERNAL_API_KEY", 
                      str(ROOT / "secrets" / "test_api_key.txt"))
os.environ.setdefault("MODEL_PATH", 
                      str(ROOT / "src" / "ml_inference_app" / "models" / "linear_svc_pipeline_v1.joblib"))
os.environ.setdefault("LABEL_ENCODER_PATH", 
                      str(ROOT / "src" / "ml_inference_app" /"models" / "articles-bypublisher_LabelEncoder_v1.joblib"))

import pytest
# from src.app import app
from ml_inference_app.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()

