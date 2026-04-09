"""
Description: This module defines the Pydantic schemas for the prediction request body and headers.
    These schemas are used for validating the input data for the /predict endpoint of the Flask API.
Author: 
    Osvaldo Hernandez-Segura
Date Created: 
    April 8, 2026
Date Modified: 
    April 9, 2026
References: Copilot, ChatGPT, Pydantic documentation
"""

from pydantic import BaseModel, Field

class PredictRequestBodySchema(BaseModel):
    """
    Schema for the prediction request body.
    """
    text: str = Field(..., 
                      description="The input text for the prediction must be between 1 to 3000 chars.", 
                      min_length=1, max_length=3000)

class PredictRequestHeadersSchema(BaseModel):
    """
    Schema for the prediction request headers.
    """
    content_type: str = Field(..., 
                              description="The content type of the request must be application/json.",
                              min_length=1)
    x_internal_api_key: str = Field(..., 
                                    description="The internal API key for authentication. Must be provided in the X-Internal-API-Key header.",
                                    min_length=1)
