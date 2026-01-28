"""
Description:
    This test module contains unit tests for the /predict endpoint of the Flask API
    that serves a machine learning model for predicting political bias from text input.
    The tests cover scenarios including successful predictions, missing API keys,
    and invalid API keys.

How to run:
    The conftest.py file must be in the same directory as this test file and
    is responsible for running this script automatically.

Author:
    Osvaldo Hernandez-Segura

Date Created:
    January 26, 2026

Date Modified:
    January 26, 2026

References:
    Copilot, ChatGPT, Flask documentation
"""

text = """ 
Air Force One returns to Washington area due to minor electrical issue, 
White House says\n\nPresident Donald Trump’s plane, Air Force One, 
returned to Joint Base Andrews about an hour after departing for Switzerland on Tuesday evening. 
White House press secretary Karoline Leavitt said the decision to return was made after takeoff 
when the crew aboard Air Force One identified a minor electrical issue and, out of an abundance of caution, 
decided to turn around.\n\nA reporter on board said the lights in the press cabin of the aircraft went 
out briefly after takeoff, but no explanation was immediately offered. About half an hour into the flight, 
reporters were told the plane would be turning around. Trump will board another aircraft and continue on 
with his trip to the World Economic Forum in Davos.\n\nThe two planes currently used as Air Force One 
have been flying for nearly four decades. Boeing has been working on replacements, but the program has 
faced a series of delays. The planes are heavily modified with survivability capabilities for the 
president for a range of contingencies, including radiation shielding and antimissile technology. 
They also include a variety of communications systems to allow the president to remain in contact 
with the military and issue orders from anywhere in the world.\n\nLast year, the ruling family of 
Qatar gifted Trump a luxury Boeing 747-8 jumbo jet to be added into the Air Force One fleet, a move 
that faced great scrutiny. That plane is currently being retrofitted to meet security requirements. 
Leavitt joked to reporters on Air Force One Tuesday night that a Qatari jet was sounding much better 
right now.\n\nLast February, an Air Force plane carrying Secretary of State Marco Rubio to Germany 
had to return to Washington because of a mechanical issue. In October, a military plane carrying 
Defense Secretary Pete Hegseth had to make an emergency landing in the United Kingdom due to a crack 
in the windshield.
"""

TEST_API_KEY = "ci-test-api-key"

def test_predict_ok(client):
    resp = client.post("/predict", 
                       json={"text": text},
                       headers={"X-Internal-API-Key": TEST_API_KEY}) 
    assert resp.status_code == 200

def test_predict_missing_api_key(client):
    resp = client.post("/predict", 
                       json={"text": text},
                       headers={"X-Internal-API-Key": ""})
    assert resp.status_code == 401

def test_predict_invalid_api_key(client):
    resp = client.post("/predict", 
                       json={"text": text},
                       headers={"X-Internal-API-Key": "invalid-api-key"})
    assert resp.status_code == 403

