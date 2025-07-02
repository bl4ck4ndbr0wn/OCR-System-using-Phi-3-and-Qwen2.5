# OCR System Backend with Phi-3 and Qwen2.5 Integration

This is the backend component of the OCR system that integrates Microsoft's Phi-3-Vision and Qwen2.5 models for enhanced text extraction.

## Technology Stack

- **[FastAPI](https://fastapi.tiangolo.com/)**: High-performance web framework for building APIs
- **[PyTesseract](https://github.com/madmaze/pytesseract)**: Python wrapper for Google's Tesseract OCR engine
- **[EasyOCR](https://github.com/JaidedAI/EasyOCR)**: Ready-to-use OCR with 80+ supported languages
- **[OpenCV](https://opencv.org/)**: Computer vision library for image preprocessing
- **[Hugging Face Transformers](https://huggingface.co/docs/transformers/index)**: Library for state-of-the-art NLP and vision models
- **[Torch](https://pytorch.org/)**: Deep learning framework used by the AI models
- **[Pydantic](https://pydantic-docs.helpmanual.io/)**: Data validation and settings management
- **[Uvicorn](https://www.uvicorn.org/)**: ASGI server implementation for running FastAPI

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routes and endpoints
│   ├── core/             # Core functionality and configuration
│   ├── models/           # Data models (if needed)
│   ├── services/         # Services for OCR and AI models
│   │   ├── ocr_service.py     # Base OCR service
│   │   ├── phi3_service.py    # Microsoft Phi-3 integration
│   │   └── qwen_service.py    # Qwen2.5 integration
│   └── main.py           # FastAPI application
├── main.py               # Entry point
├── requirements-cpu.txt  # CPU-only dependencies
├── requirements-gpu.txt  # GPU-enabled dependencies
└── README.md            # This file
```

## Prerequisites

1. **Python Version**:
   - Python 3.8 - 3.10 (recommended)
   - Python 3.11 is not fully supported by some dependencies

2. **System Requirements**:
   - Tesseract OCR installed on your system:
     - macOS: `brew install tesseract`
     - Ubuntu: `sudo apt-get install tesseract-ocr`
     - Windows: Download installer from <https://github.com/UB-Mannheim/tesseract/wiki>

## Installation and Setup

1. **Create a virtual environment with the correct Python version**:

   ```bash
   # First, ensure you have Python 3.8-3.10 installed
   python --version  # Should show 3.8.x, 3.9.x, or 3.10.x

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Upgrade pip and install wheel**:

   ```bash
   pip install --upgrade pip
   pip install wheel
   ```

3. **Install dependencies based on your hardware**:

   For CPU-only systems (e.g., Intel MacBooks):

   ```bash
   pip install -r requirements-cpu.txt
   ```

   For GPU-enabled systems (NVIDIA GPUs):

   ```bash
   pip install -r requirements-gpu.txt
   ```

4. **Run the server**:

   ```bash
   python main.py
   ```

   The server will start on <http://localhost:8000>

5. **API Documentation**:
   - Swagger UI: <http://localhost:8000/docs>
   - ReDoc: <http://localhost:8000/redoc>

## API Endpoints

### GET `/`

Returns a welcome message.

**Response**:

```json
{
  "message": "Welcome to the OCR API with Phi-3 and Qwen2.5 integration"
}
```

### GET `/api/v1/models`

Returns information about the available OCR enhancement models.

**Response**:

```json
{
  "models": [
    {
      "id": "phi3",
      "name": "Microsoft Phi-3-Vision",
      "description": "Vision-language model for processing both text and images",
      "capabilities": ["OCR enhancement", "image understanding", "visual context integration"],
      "gpu_required": true
    },
    {
      "id": "qwen25",
      "name": "Qwen2.5",
      "description": "Advanced language model for text processing with multilingual support",
      "capabilities": ["text enhancement", "multilingual processing", "document understanding"],
      "gpu_required": true
    },
    {
      "id": "tesseract",
      "name": "Tesseract OCR",
      "description": "Open-source OCR engine with broad language support",
      "capabilities": ["Fast text extraction", "Multi-language support", "Basic text recognition"],
      "gpu_required": false
    },
    {
      "id": "easyocr",
      "name": "EasyOCR",
      "description": "Modern OCR engine with deep learning capabilities",
      "capabilities": ["High-accuracy text extraction", "Multi-language support", "Confidence scoring"],
      "gpu_required": false
    }
  ]
}
```

### POST `/api/v1/extract-text`

Extracts and enhances text from an uploaded image using the specified AI model.

**Request**:

- Content-Type: `multipart/form-data`
- Form fields:
  - `file`: Image file (required)
  - `model`: Model to use for enhancement (default: "phi3")
  - `languages`: Array of language codes for the text (optional)
  - `use_gpu`: Boolean to enable/disable GPU usage (default: false)

**Response**:

```json
{
  "raw_text": "This is the raw texl extracted by OCR engnie.",
  "enhanced_text": "This is the raw text extracted by OCR engine.",
  "model_used": "phi3",
  "confidence": 0.95,
  "processing_time": 1.45,
  "model_details": {
    "name": "Phi-3-Vision-128K-Instruct",
    "version": "1.0",
    "context_length": "128K",
    "parameters": "4.2B",
    "device": "cpu",
    "gpu_enabled": false,
    "gpu_name": null
  },
  "languages": ["en"],
  "raw_response": "..."
}
```

**Error Responses**:

- 400 Bad Request: If the uploaded file is not an image, the model is invalid, or GPU is required but not available
- 500 Internal Server Error: If an error occurs during processing

### POST `/api/v1/scanner/extract-text`

Extracts and enhances text from images sent directly from Canon scanners.

**Request**:

- Content-Type: `application/json` or `multipart/form-data`
- Body:

  ```json
  {
    "image_data": "base64_encoded_image_string",
    "scanner_info": {
      "model": "Canon DR-C225",
      "serial": "12345ABCDE",
      "resolution": 300
    }
  }
  ```

- Form fields (if using multipart/form-data):
  - `model`: Model to use for enhancement, either "phi3" or "qwen25" (default: "phi3")
  - `languages`: Array of language codes for the text (optional)

**Response**:

```json
{
  "raw_text": "This is the raw texl extracted by OCR engnie.",
  "enhanced_text": "This is the raw text extracted by OCR engine.",
  "model_used": "phi3",
  "confidence": 0.95,
  "processing_time": 1.45,
  "scanner_info": {
    "model": "Canon DR-C225",
    "serial": "12345ABCDE",
    "resolution": 300
  }
}
```

**Error Responses**:

- 400 Bad Request: If the image data is missing or invalid, or if the model is invalid
- 500 Internal Server Error: If an error occurs during processing

## How the System Works

1. **Image Upload**: User uploads an image through the API or directly from a Canon scanner.

2. **Base OCR Processing**: The `OCRService` processes the image with both Tesseract and EasyOCR:
   - Image is preprocessed (grayscale conversion, thresholding)
   - Text is extracted using both OCR engines
   - Results are combined using simple heuristics

3. **AI Model Enhancement**: The extracted text is enhanced using the selected model:
   - **Phi-3-Vision**: Processes both the extracted text and the original image to correct errors
   - **Qwen2.5**: Uses only the extracted text for enhancement

4. **Result**: The system returns both the raw OCR text and the AI-enhanced text.

## Working with the Models

### Phi-3-Vision Model

The Phi-3-Vision model is a multimodal model that can process both text and images, making it ideal for OCR enhancement. It receives both the raw OCR text and the original image, allowing it to correct errors by understanding the visual context.

### Qwen2.5 Model

The Qwen2.5 model is a text-only language model with strong multilingual capabilities. It receives only the raw OCR text and enhances it based on its language understanding.

## Canon Scanner Integration

This backend supports integration with Canon scanners using Canon's DR Web SDK or ScanFront Embedded SDK.

### Integration Steps

1. Install the Canon SDK on the client machine.
2. Configure the scanner to send scanned documents to the `/api/v1/scanner/extract-text` endpoint.
3. Ensure images are properly encoded in base64 format before sending.

### Scanner Configuration

For Canon DR series scanners:

- Use the DR Web SDK to create a custom scanning profile
- Configure the scan job to send the document to this API endpoint
- Ensure proper image format (JPEG or PNG recommended)

For Canon ScanFront series:

- Use the ScanFront Embedded SDK to add a custom button on the device
- Configure the button to POST scanned documents to this API endpoint
- Set proper resolution and image format

## Required Enhancements

1. **Add language detection**:
   - Implement automatic language detection for better OCR results
   - Update the OCR service to use detected languages

2. **Add PDF support**:
   - Add functionality to handle PDF documents
   - Extract text from multiple pages

3. **Implement proper error handling**:
   - Add more specific error messages
   - Implement logging for better debugging

4. **Add unit tests**:
   - Create test cases for all services and endpoints
   - Set up CI/CD pipeline

5. **Optimize performance**:
   - Implement caching for frequently processed documents
   - Add support for batch processing

6. **Security improvements**:
   - Add rate limiting
   - Implement proper authentication/authorization
   - Configure CORS properly for production

## Environment Variables

You can configure the following environment variables:

- `PHI3_MODEL_NAME`: Custom model name for Phi-3-Vision (default: "microsoft/phi-3-vision-128k-instruct")
- `QWEN25_MODEL_NAME`: Custom model name for Qwen2.5 (default: "Qwen/Qwen2.5-7B-Instruct")
- `USE_GPU`: Whether to use GPU for model inference (default: false)
- `MAX_UPLOAD_SIZE`: Maximum upload size in bytes (default: 10MB)

## Hardware Requirements

### CPU-Only Systems

- Minimum 8GB RAM
- Recommended 16GB RAM
- Intel/AMD processor with AVX2 support
- SSD storage recommended for faster model loading

### GPU-Enabled Systems

- NVIDIA GPU with at least 8GB VRAM
- CUDA 11.8 or later
- cuDNN 8.6 or later
- Minimum 16GB system RAM
- SSD storage recommended

## Troubleshooting

### Common Issues

1. **Python Version Issues**:
   - Ensure you're using Python 3.8-3.10
   - If you have multiple Python versions, specify the correct version:

     ```bash
     python3.10 -m venv venv
     ```

2. **Dependency Installation Issues**:
   - If you encounter version conflicts, try installing dependencies one by one
   - For CPU-only systems, ensure you're using the CPU-specific PyTorch version
   - If you get errors about missing dependencies, try:

     ```bash
     pip install --upgrade pip setuptools wheel
     ```

3. **Model loading errors**:
   - Ensure you have sufficient memory for the models
   - For GPU issues, check CUDA installation and compatibility
   - Try using CPU mode if GPU mode fails

4. **OCR quality issues**:
   - Ensure Tesseract is properly installed
   - Try different image preprocessing parameters

5. **Slow processing**:
   - Consider using smaller models for faster processing
   - Ensure your hardware meets the requirements for running these models
   - For CPU-only systems, expect longer processing times

6. **Scanner connection issues**:
   - Verify that the scanner is properly configured to send data to the API
   - Check network connectivity between the scanner and the server
   - Ensure the base64 encoding is properly implemented

7. **GPU-related issues**:
   - Verify CUDA installation: `nvidia-smi`
   - Check PyTorch CUDA support: `python -c "import torch; print(torch.cuda.is_available())"`
   - Ensure you're using the correct requirements file for your hardware
