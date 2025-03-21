import io
import time
import base64
from typing import Dict, List, Any, Optional
from PIL import Image
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoProcessor

class Phi3VisionService:
    def __init__(self):
        """Initialize the Phi-3-Vision model"""
        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Using device: {self.device}")

            # Load Phi-3-Vision model
            # Using microsoft/phi-3-vision-128k-instruct
            self.model_name = "microsoft/phi-3-vision-128k-instruct"
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True,
                use_flash_attention_2=False  # Disable flash attention
            )
            self.processor = AutoProcessor.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )

            print("Phi-3-Vision model loaded successfully")
        except Exception as e:
            print(f"Error initializing Phi-3-Vision model: {str(e)}")
            # Fallback to a simplified initialization to avoid breaking the application
            self.model = None
            self.processor = None

    async def process_text_and_image(
        self,
        text: str,
        image_bytes: bytes,
        languages: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Process text and image with Phi-3-Vision model"""
        start_time = time.time()

        if self.model is None or self.processor is None:
            return {
                "text": text,
                "confidence": 0.0,
                "processing_time": 0.0,
                "error": "Model not initialized properly"
            }

        try:
            # Convert image bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))

            # Create prompt based on the task
            language_str = ""
            if languages and len(languages) > 0:
                language_str = f" The text is in {', '.join(languages)}."

            prompt = f"""<|system|>
You are an expert OCR assistant. Your task is to correct and enhance the raw OCR text extracted from the image.
Fix any errors, maintain the original formatting, and ensure the text is coherent and accurate.{language_str}
<|user|>
Here is the raw OCR text extracted from the image:

{text}

Please correct and enhance this text based on the image content.
<|assistant|>
"""

            # Process image and text with Phi-3-Vision
            inputs = self.processor(text=prompt, images=image, return_tensors="pt").to(self.device)

            # Generate enhanced text
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=1024,
                    do_sample=False
                )

            # Decode the generated text
            generated_text = self.processor.decode(outputs[0], skip_special_tokens=True)

            # Extract the assistant's response
            # This is a simple extraction - might need adjustment based on actual output format
            if "<|assistant|>" in generated_text:
                enhanced_text = generated_text.split("<|assistant|>")[-1].strip()
            else:
                enhanced_text = generated_text.strip()

            processing_time = time.time() - start_time

            return {
                "text": enhanced_text,
                "confidence": 0.95,  # Placeholder confidence score
                "processing_time": processing_time
            }

        except Exception as e:
            print(f"Error processing with Phi-3-Vision: {str(e)}")
            return {
                "text": text,  # Return original text on error
                "confidence": 0.0,
                "processing_time": time.time() - start_time,
                "error": str(e)
            }
