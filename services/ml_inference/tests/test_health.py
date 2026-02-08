"""
Description:
    This test module contains unit tests for the /health endpoint of the Flask API
    that serves a machine learning model for predicting political bias from text input.
    The tests cover two scenarios, including a successful status check (200) and
    valid response content (status: "ok").

Author:
    Osvaldo Hernandez-Segura

Date Created:
    February 7, 2026

Date Modified:
    February 7, 2026

References:
    Copilot
"""
import pytest

def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json.get("status") == "ok"
