"""
Description:
    This script implements internal API key verification for a Flask-based
    machine learning inference service. It checks the provided API key in the
    request headers against a predefined internal API key stored in environment
    variables to ensure secure access to the service.

Author:
    Osvaldo Hernandez-Segura

Data Created:
    January 21, 2026

Date Modified:
    April 9, 2026

References:
    Copilot, ChatGPT, Flask documentation
"""
import os
from flask import request, jsonify

INTERNAL_API_KEY_PATH = os.getenv("INTERNAL_API_KEY", "")

with open(INTERNAL_API_KEY_PATH, "r") as f:
    INTERNAL_API_KEY = f.read()
    INTERNAL_API_KEY = INTERNAL_API_KEY.strip()

def internal_api_key_verification():
    """
    Verifies the internal API key provided in the request headers for the 
    ml inference service.

    Returns:
        bool: True if the API key is valid, otherwise returns a Flask
                response with an error message and appropriate status code.
    """
    if not INTERNAL_API_KEY:
        return jsonify({"error": "Internal API key is not set."}), 500

    provided_api_key = request.headers.get("X-Internal-API-Key")

    if not provided_api_key:
        return jsonify({"error": "Unauthorized access. API key is missing."}), 401

    provided_api_key = provided_api_key.strip()

    if provided_api_key != INTERNAL_API_KEY:
        return jsonify({"error": "Unauthorized access. Invalid API key."}), 401

    return True 
