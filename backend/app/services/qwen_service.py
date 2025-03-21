import time
from typing import Dict, List, Any, Optional
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

class Qwen25Service:
    def __init__(self):
        """Initialize the Qwen2.5 model"""
        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Using device: {self.device}")

            # Load Qwen2.5 model
            # Using Qwen/Qwen2.5-7B-Instruct
            self.model_name = "Qwen/Qwen2.5-7B-Instruct"
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True
            )

            print("Qwen2.5 model loaded successfully")
        except Exception as e:
            print(f"Error initializing Qwen2.5 model: {str(e)}")
            # Fallback to a simplified initialization to avoid breaking the application
            self.model = None
            self.tokenizer = None

    async def process_text(
        self,
        text: str,
        languages: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Process text with Qwen2.5 model"""
        start_time = time.time()

        if self.model is None or self.tokenizer is None:
            return {
                "text": text,
                "confidence": 0.0,
                "processing_time": 0.0,
                "error": "Model not initialized properly"
            }

        try:
            # Create prompt based on the task
            language_str = ""
            if languages and len(languages) > 0:
                language_str = f" The text is in {', '.join(languages)}."

            prompt = f"""<|im_start|>system
You are an expert OCR post-processing assistant. Your task is to correct and enhance raw OCR text.
Fix any errors, maintain the original formatting, and ensure the text is coherent and accurate.{language_str}
<|im_end|>
<|im_start|>user
Here is the raw OCR text that needs correction and enhancement:

{text}
<|im_end|>
<|im_start|>assistant
"""

            # Generate enhanced text with Qwen2.5
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=1024,
                    do_sample=False
                )

            # Decode the generated text
            full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=False)

            # Extract the assistant's response
            if "<|im_start|>assistant" in full_response:
                response_text = full_response.split("<|im_start|>assistant")[-1]
                if "<|im_end|>" in response_text:
                    enhanced_text = response_text.split("<|im_end|>")[0].strip()
                else:
                    enhanced_text = response_text.strip()
            else:
                enhanced_text = full_response.strip()

            processing_time = time.time() - start_time

            # Evaluate confidence based on changes made
            # Simple heuristic: more changes = lower confidence
            # This is a placeholder - a real implementation would be more sophisticated
            original_words = set(text.lower().split())
            enhanced_words = set(enhanced_text.lower().split())
            word_diff_ratio = len(original_words.intersection(enhanced_words)) / max(len(original_words), 1)
            confidence = min(0.95, max(0.5, word_diff_ratio))

            return {
                "text": enhanced_text,
                "confidence": confidence,
                "processing_time": processing_time
            }

        except Exception as e:
            print(f"Error processing with Qwen2.5: {str(e)}")
            return {
                "text": text,  # Return original text on error
                "confidence": 0.0,
                "processing_time": time.time() - start_time,
                "error": str(e)
            }
