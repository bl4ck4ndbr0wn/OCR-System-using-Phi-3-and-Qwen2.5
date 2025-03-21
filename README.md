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

1. Make sure you have Python 3.8+ installed
2. Install Tesseract OCR on your system:
   - macOS: `brew install tesseract`
   - Ubuntu: `sudo apt-get install tesseract-ocr`
   - Windows: Download installer from https://github.com/UB-Mannheim/tesseract/wiki
3. Set up and activate a virtual environment (optional but recommended):
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the backend server:
   ```bash
   python main.py
   ```
   The server will be available at http://localhost:8000

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
   The frontend will be available at http://localhost:5173

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
