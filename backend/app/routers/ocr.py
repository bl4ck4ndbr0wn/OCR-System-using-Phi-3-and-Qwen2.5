from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, ConfigDict
from ..services.phi3_service import Phi3VisionService
from ..services.qwen_service import Qwen25Service
import base64
import torch

router = APIRouter(tags=["OCR"])


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    capabilities: List[str]
    gpu_required: bool = False


class ModelDetails(BaseModel):
    name: str
    version: str
    context_length: str
    parameters: str
    device: str
    gpu_enabled: bool
    gpu_name: Optional[str] = None


class OCRResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    raw_text: str
    enhanced_text: str
    model_used: str
    confidence: float
    processing_time: float
    scanner_info: Dict[str, Any] = {}
    model_details: Optional[ModelDetails] = None
    languages: Optional[List[str]] = None
    raw_response: Optional[str] = None


# Initialize OCR services

@router.get("/models", response_model=Dict[str, List[ModelInfo]])
async def get_models():
    """Get available OCR models"""
    try:
        has_gpu = torch.cuda.is_available()
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
                ],
                gpu_required=True
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
                ],
                gpu_required=True
            )
        ]
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-text", response_model=OCRResponse)
async def extract_text(
    file: UploadFile = File(...),
    model: str = Form("phi3"),
    languages: Union[str, List[str]] = Form(None),
    use_gpu: bool = Form(False)
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
        image_bytes = await file.read()
        results = None

        # Check if GPU is required but not available
        if model.lower() in ["phi3", "qwen25"] and not torch.cuda.is_available() and use_gpu:
            raise HTTPException(
                status_code=400,
                detail="GPU is required for this model but not available on your system"
            )

        # Process with the specified model
        if model.lower() == "phi3":
            phi3_service = Phi3VisionService(use_gpu=use_gpu)
            results = await phi3_service.process_text_and_image("", image_bytes, languages)
        elif model.lower() == "qwen25":
            qwen_service = Qwen25Service()
            results = await qwen_service.process_text("", languages)
        else:
            raise HTTPException(status_code=400, detail="Invalid model specified. Use 'phi3' or 'qwen25'")

        # Convert model details if available
        model_details = None
        if "model_info" in results:
            model_details = ModelDetails(**results["model_info"])

        return {
            "raw_text": results["text"],
            "enhanced_text": results["text"],  # For non-enhancement models, raw and enhanced are the same
            "model_used": model,
            "confidence": results.get("confidence", 0.0),
            "processing_time": results.get("processing_time", 0.0),
            "scanner_info": {},  # Add empty dict for non-scanner uploads
            "model_details": model_details,
            "languages": results.get("languages"),
            "raw_response": results.get("raw_response")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# @router.post("/scanner/extract-text", response_model=OCRResponse)
# async def scanner_extract_text(
#     image_data: str = Form(...),
#     model: str = Form("phi3"),
#     languages: str = Form(None),  # Change to str to accept JSON string
#     scanner_info: str = Form(...),  # Change to str to accept JSON string
# ):
#     """
#     Extract text from Canon scanner image
#     """
#     try:
#         # Parse JSON inputs
#         import json
#         languages_list = json.loads(languages) if languages else None
#         scanner_info_dict = json.loads(scanner_info)

#         # Rest of the function remains the same...
#         if not image_data:
#             raise HTTPException(status_code=400, detail="Image data not found in the request")

#         base64_image = image_data
#         try:
#             # Decode base64 image
#             image_bytes = base64.b64decode(base64_image)
#         except Exception:
#             raise HTTPException(status_code=400, detail="Invalid base64 image data")

#         results = None

#         # Check if GPU is required but not available
#         if model.lower() in ["phi3", "qwen25"] and not torch.cuda.is_available() and use_gpu:
#             raise HTTPException(
#                 status_code=400,
#                 detail="GPU is required for this model but not available on your system"
#             )

#         # Enhance text using the specified model
#         if model.lower() == "phi3":
#             phi3_service = Phi3VisionService()
#             enhanced_results = await phi3_service.process_text_and_image(extracted_text, image_bytes, languages_list)
#         elif model.lower() == "qwen25":
#             qwen_service = Qwen25Service()
#             enhanced_results = await qwen_service.process_text(extracted_text, languages_list)
#         else:
#             raise HTTPException(status_code=400, detail="Invalid model specified. Use 'phi3' or 'qwen25'")

#         return {
#             "raw_text": extracted_text,
#             "enhanced_text": enhanced_results["text"],
#             "model_used": model,
#             "confidence": enhanced_results.get("confidence", None),
#             "processing_time": enhanced_results.get("processing_time", None),
#             "scanner_info": scanner_info_dict
#         }

#     except json.JSONDecodeError:
#         raise HTTPException(status_code=400, detail="Invalid JSON format in languages or scanner_info")
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing scanner image: {str(e)}")
