import io
import cv2
import numpy as np
import pytesseract
import easyocr
from PIL import Image
import time
from typing import Dict, List, Any, Optional

class OCRService:
    def __init__(self):
        self.reader = easyocr.Reader(['en'])  # Initialize with English

    async def process_image(self, image_bytes: bytes) -> str:
        """Process image with OCR to extract text"""
        start_time = time.time()

        # Convert bytes to image
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to OpenCV format
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Preprocess image for better OCR results
        preprocessed = self._preprocess_image(cv_image)

        # Use both Tesseract and EasyOCR for best results
        tesseract_text = self._extract_with_tesseract(preprocessed)
        easyocr_results = self._extract_with_easyocr(preprocessed)

        # Combine results (simple approach - could be more sophisticated)
        if not tesseract_text.strip() and easyocr_results:
            final_text = easyocr_results
        elif not easyocr_results.strip() and tesseract_text:
            final_text = tesseract_text
        else:
            # If both methods extracted text, use the one with more content
            # This is a simple heuristic - could be improved
            final_text = tesseract_text if len(tesseract_text) > len(easyocr_results) else easyocr_results

        processing_time = time.time() - start_time
        print(f"OCR processing time: {processing_time:.2f} seconds")

        return final_text

    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Optional: noise removal (uncomment if needed)
        # kernel = np.ones((1, 1), np.uint8)
        # thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        # thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        return thresh

    def _extract_with_tesseract(self, image: np.ndarray) -> str:
        """Extract text using Tesseract OCR"""
        try:
            return pytesseract.image_to_string(image)
        except Exception as e:
            print(f"Tesseract error: {str(e)}")
            return ""

    def _extract_with_easyocr(self, image: np.ndarray) -> str:
        """Extract text using EasyOCR"""
        try:
            results = self.reader.readtext(image)
            return ' '.join([result[1] for result in results])
        except Exception as e:
            print(f"EasyOCR error: {str(e)}")
            return ""
