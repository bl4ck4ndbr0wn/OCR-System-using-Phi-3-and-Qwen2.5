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

    # AI Models settings
    PHI3_MODEL_NAME: str = "microsoft/phi-3-vision-128k-instruct"
    QWEN25_MODEL_NAME: str = "Qwen/Qwen2.5-7B-Instruct"

    # File upload settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "bmp", "tiff", "pdf"]

    # OCR settings
    DEFAULT_OCR_LANGUAGES: List[str] = ["en"]
    USE_GPU: bool = True

# Create global settings object
settings = Settings()
