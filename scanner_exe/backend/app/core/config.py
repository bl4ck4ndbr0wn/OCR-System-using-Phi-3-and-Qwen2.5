from pydantic import BaseModel
from typing import List, Optional
import os

class Settings(BaseModel):
    """Application settings"""

    # API settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "OCR System with Phi-3 and Qwen2.5"

    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

# Create global settings object
settings = Settings()
