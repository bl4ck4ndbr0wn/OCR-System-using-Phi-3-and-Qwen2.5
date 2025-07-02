from typing import Optional, List
from pydantic import BaseModel


class ScanRequest(BaseModel):
    scanner_id: str
    resolution: Optional[int] = 300
    color_mode: Optional[str] = "color"  # color, grayscale, or black_and_white
    client_id: Optional[str] = None

class ScanResponse(BaseModel):
    success: bool
    message: str
    image_data: Optional[str] = None  # Base64 encoded image

class Scanner(BaseModel):
    id: str
    name: str
    manufacturer: str
    model: str
    type: Optional[str] = None

class ListScannersResponse(BaseModel):
    action: str = "list_scanners"
    scanners: List[Scanner]
