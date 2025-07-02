import io
import time
from typing import Dict, Any, List, Optional
from PIL import Image
from transformers import AutoModelForCausalLM, AutoProcessor
import torch
from huggingface_hub import snapshot_download
import os

class Phi3VisionService:
    def __init__(self, use_gpu: bool = False):
        """
        Initialize the Phi-3 Vision service
        Args:
            use_gpu (bool): Whether to use GPU if available. If False, forces CPU usage.
        """
        self.model_id = "microsoft/phi-3-vision-128k-instruct"
        self.model = None
        self.processor = None
        self.use_gpu = use_gpu and torch.cuda.is_available()
        self.device = "cuda" if self.use_gpu else "cpu"
        self.model_path = None

        print(f"Initializing Phi3VisionService with device: {self.device}")
        print(f"Model ID: {self.model_id}")

        if self.use_gpu:
            print(f"Using GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("Using CPU mode")

    async def _download_model(self):
        """Download the model files if not already present"""
        try:
            # Create a directory for the model if it doesn't exist
            model_dir = os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub", "models--microsoft--Phi-3-vision-128k-instruct")
            os.makedirs(model_dir, exist_ok=True)

            # Download the model files
            self.model_path = snapshot_download(
                repo_id=self.model_id,
                local_dir=model_dir,
                local_dir_use_symlinks=False,
                resume_download=True
            )
            print(f"Model downloaded to: {self.model_path}")
        except Exception as e:
            print(f"Error downloading model: {str(e)}")
            raise

    async def _load_model(self):
        """Lazy loading of the model and processor"""
        try:
            if self.model is None:
                # Ensure model is downloaded
                if not self.model_path:
                    await self._download_model()

                print(f"Loading model from: {self.model_path}")

                # Configure model loading based on device
                model_kwargs = {
                    "device_map": self.device,
                    "trust_remote_code": True,
                }

                if self.use_gpu:
                    model_kwargs.update({
                        "torch_dtype": torch.float16,
                        "_attn_implementation": "flash_attention_2"
                    })
                else:
                    model_kwargs.update({
                        "torch_dtype": torch.float32,
                        "_attn_implementation": "eager"
                    })

                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_path,
                    **model_kwargs
                )
                print("Model loaded successfully")

                self.processor = AutoProcessor.from_pretrained(
                    self.model_path,
                    trust_remote_code=True
                )
                print("Processor loaded successfully")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise

    async def process_text_and_image(
        self,
        text: str,
        image_bytes: bytes,
        languages: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Process text and image using Phi-3 Vision model"""
        start_time = time.time()

        try:
            await self._load_model()

            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))

            # Prepare the prompt
            prompt = f"""<|system|>
You are an expert OCR assistant. Your task is to accurately extract text from the image.
Ensure the text is coherent, maintains the original formatting, and is free of errors.
<|user|>
<|image_1|>
Extract and enhance the text from this image. If multiple languages are present, identify them.
<|end|>
<|assistant|>
"""
            # Process inputs
            inputs = self.processor(
                text=prompt,
                images=image,
                return_tensors="pt"
            ).to(self.device)

            # Generate response
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.processor.tokenizer.pad_token_id,
                eos_token_id=self.processor.tokenizer.eos_token_id
            )

            # Decode response
            response = self.processor.decode(outputs[0], skip_special_tokens=True)

            # Extract the assistant's response
            # This is a simple extraction - might need adjustment based on actual output format
            if "<|assistant|>" in response:
                enhanced_text = response.split("<|assistant|>")[-1].strip()
            else:
                enhanced_text = response.strip()

            # Calculate confidence score (simplified)
            confidence = 0.85  # Placeholder confidence score

            processing_time = time.time() - start_time

            return {
                "text": enhanced_text,
                "confidence": confidence,
                "processing_time": processing_time,
                "model_info": {
                    "name": "Phi-3-Vision-128K-Instruct",
                    "version": "1.0",
                    "context_length": "128K",
                    "parameters": "4.2B",
                    "device": self.device,
                    "gpu_enabled": self.use_gpu,
                    "gpu_name": torch.cuda.get_device_name(0) if self.use_gpu else None
                },
                "languages": languages or ["en"],
                "raw_response": response
            }

        except Exception as e:
            print(f"Error in Phi3VisionService: {str(e)}")
            return {
                "text": "",
                "confidence": 0.0,
                "processing_time": time.time() - start_time,
                "error": str(e)
            }
