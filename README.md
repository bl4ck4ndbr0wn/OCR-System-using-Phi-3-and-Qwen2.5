# OCR System with Phi-3 and Qwen2.5 Integration

This project implements an OCR (Optical Character Recognition) system that integrates Microsoft's Phi-3-Vision and Qwen2.5 models to enhance text extraction from images.

## Features

- OCR processing with both Tesseract and EasyOCR for better accuracy
- Text enhancement using Microsoft Phi-3-Vision model, which can process both text and images
- Multilingual text enhancement using Qwen2.5 language model
- React + TypeScript frontend with Material UI
- FastAPI backend with async processing

## Project Structure

```
ocr/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core functionality and config
│   │   ├── models/        # Data models
│   │   └── services/      # Services for OCR and AI models
│   ├── main.py            # Backend entry point
│   └── requirements.txt   # Python dependencies
└── frontend/              # React + TypeScript frontend
    ├── public/            # Static assets
    └── src/
        ├── components/    # React components
        ├── pages/         # Page components
        ├── services/      # API services
        └── utils/         # Utility functions
```

## Setup

### Backend

#### Prerequisites

- **Python Version**: Python 3.8 - 3.10 is recommended. Python 3.11 is not fully supported by some dependencies.
- [NOT IN USE IN V2] **Tesseract OCR**: Install Tesseract on your system:
  - **macOS**: `brew install tesseract`
  - **Ubuntu**: `sudo apt-get install tesseract-ocr`
  - **Windows**: Download the installer from the [Tesseract at UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki) page.

#### Installation

1. **Navigate to the backend directory and create a virtual environment**:

    ```bash
    cd backend
    
    # Ensure you have a compatible Python version
    python --version # Should be 3.8.x, 3.9.x, or 3.10.x
    
    # Create and activate virtual environment
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2. **Upgrade pip and install dependencies**:

    ```bash
    pip install --upgrade pip
    pip install wheel
    ```

3. **Install Python packages based on your hardware**:

    - **For CPU-only systems**:

      ```bash
      pip install -r requirements-cpu.txt
      ```

    - **For GPU-enabled systems (NVIDIA)**:

      ```bash
      pip install -r requirements-gpu.txt
      ```

    - A general `requirements.txt` is also available, but the hardware-specific files are recommended for optimal performance.

#### Running the Backend

1. **Start the server**:

    ```bash
    python main.py
    ```

    The server will be available at `http://localhost:8000`.

2. **API Documentation**:
    - **Swagger UI**: `http://localhost:8000/docs`
    - **ReDoc**: `http://localhost:8000/redoc`

### Frontend

1. Make sure you have Node.js and npm installed
2. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

   The frontend will be available at <http://localhost:5173>

## Usage

1. Open the web application in your browser
2. Upload an image or take a picture
3. Select the AI model to use for processing (Phi-3 or Qwen2.5)
4. Click "Extract Text" to process the image
5. View and download the extracted text

## Scanner Integration

The system supports integration with Canon scanners using Canon's DR Web SDK or ScanFront Embedded SDK. To set up scanner integration:

1. Obtain the appropriate SDK from Canon Developer Program
2. Configure the scanner according to Canon's documentation
3. Update the frontend to use the scanner SDK for image acquisition

## Models

### Microsoft Phi-3-Vision

A multimodal vision-language model that can process both text and images, improving OCR accuracy by understanding visual context.

### Qwen2.5

An advanced language model for text processing with multilingual support, enhancing the quality and readability of extracted text.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
