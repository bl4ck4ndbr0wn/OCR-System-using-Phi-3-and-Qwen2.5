from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, ConfigDict
from ..services.phi3_service import Phi3VisionService
from ..services.ocr_service import OCRService
from ..services.qwen_service import Qwen25Service
import pytesseract
from PIL import Image
import io
import base64

router = APIRouter(tags=["OCR"])


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    capabilities: List[str]


class OCRResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    raw_text: str
    enhanced_text: str
    model_used: str
    confidence: float
    processing_time: float
    scanner_info: Dict[str, Any] = {}  # Make it optional with default empty dict


# Initialize OCR services
phi3_service = Phi3VisionService()
ocr_service = OCRService()
qwen_service = Qwen25Service()

@router.get("/models", response_model=Dict[str, List[ModelInfo]])
async def get_models():
    """Get available OCR models"""
    try:
        models = [
            ModelInfo(
                id="phi3",
                name="Microsoft Phi-3 Vision",
                description="A powerful vision-language model for OCR and text enhancement",
                capabilities=[
                    "Text extraction from images",
                    "Text enhancement and correction",
                    "Multi-language support",
                    "Layout preservation"
                ]
            ),
            ModelInfo(
                id="qwen25",
                name="Qwen2.5",
                description="Advanced OCR model with high accuracy and language understanding",
                capabilities=[
                    "High-accuracy text extraction",
                    "Multi-language support",
                    "Context-aware text enhancement",
                    "Complex layout handling"
                ]
            )
        ]
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-text", response_model=OCRResponse)
async def extract_text(
    file: UploadFile = File(...),
    model: str = Form("phi3"),
    languages: Union[str, List[str]] = Form(None)
):
    # Convert string input to list if necessary
    if isinstance(languages, str):
        try:
            # Try to parse as JSON first
            import json
            languages = json.loads(languages)
        except json.JSONDecodeError:
            # If not JSON, treat as single language
            languages = [languages]

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Process image with OCR service
        image_bytes = await file.read()
        extracted_text = await ocr_service.process_image(image_bytes)

        # Enhance text using the specified model
        if model.lower() == "phi3":
            enhanced_results = await phi3_service.process_text_and_image(extracted_text, image_bytes, languages)
        elif model.lower() == "qwen25":
            enhanced_results = await qwen_service.process_text(extracted_text, languages)
        else:
            raise HTTPException(status_code=400, detail="Invalid model specified. Use 'phi3' or 'qwen25'")

        return {
            "raw_text": extracted_text,
            "enhanced_text": enhanced_results["text"],
            "model_used": model,
            "confidence": enhanced_results.get("confidence", 0.0),
            "processing_time": enhanced_results.get("processing_time", 0.0),
            "scanner_info": {}  # Add empty dict for non-scanner uploads
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/scanner/extract-text", response_model=OCRResponse)
async def scanner_extract_text(
    payload: Dict[str, Any] = Body(...),
    model: str = Form("phi3"),
    languages: Optional[List[str]] = Form(None),
):
    """
    Extract text from Canon scanner image

    This endpoint is specifically designed to work with Canon scanners using DR Web SDK
    or ScanFront Embedded SDK.

    The request body should contain the base64-encoded image data and scanner metadata.
    """
    try:
        # Extract base64 image data from the request
        if "image_data" not in payload:
            raise HTTPException(status_code=400, detail="Image data not found in the request")

        base64_image = payload["image_data"]
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(base64_image)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

        # Process scanner metadata if available
        scanner_info = payload.get("scanner_info", {})
        scanner_model = scanner_info.get("model", "Unknown Canon Scanner")

        # Log scanner information
        print(f"Received image from scanner: {scanner_model}")

        # Process image with OCR service
        extracted_text = await ocr_service.process_image(image_bytes)

        # Enhance text using the specified model
        if model.lower() == "phi3":
            enhanced_results = await phi3_service.process_text_and_image(extracted_text, image_bytes, languages)
        elif model.lower() == "qwen25":
            enhanced_results = await qwen_service.process_text(extracted_text, languages)
        else:
            raise HTTPException(status_code=400, detail="Invalid model specified. Use 'phi3' or 'qwen25'")

        return {
            "raw_text": extracted_text,
            "enhanced_text": enhanced_results["text"],
            "model_used": model,
            "confidence": enhanced_results.get("confidence", None),
            "processing_time": enhanced_results.get("processing_time", None),
            "scanner_info": scanner_info
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing scanner image: {str(e)}")
