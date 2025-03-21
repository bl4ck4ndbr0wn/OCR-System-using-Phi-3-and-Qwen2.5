from fastapi import APIRouter, HTTPException
import sane
from PIL import Image
import io
import base64
from fastapi.responses import JSONResponse
from typing import List, Dict
import contextlib

router = APIRouter()

@router.get("/list", response_model=List[Dict[str, str]])
async def list_scanners():
    """List all available scanners"""
    try:
        # initialize scanner
        sane.init()

        # Get available devices
        devices = sane.get_devices()

        # Format devices for frontend
        scanner_list = [
            {
                "id": device[0] if len(device) > 0 else "Unknown",
                "name": device[1] if len(device) > 1 else "Unknown",
                "vendor": device[2] if len(device) > 2 else "Unknown",
                "model": device[3] if len(device) > 3 else "Unknown",
                "type": device[4] if len(device) > 4 else "Unknown"
            }
            for device in devices
        ]

        # close scanner
        sane.exit()

        return scanner_list
    except Exception as e:
        print(f"Error listing scanners: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scan/{scanner_id}")
async def scan_document(scanner_id: str):
    """Scan a document using the specified scanner"""
    try:
        # initialize scanner
        sane.init()

        # Get available devices
        devices = sane.get_devices()

        # Verify scanner exists
        scanner_exists = any(device[0] == scanner_id for device in devices)
        if not scanner_exists:
            raise HTTPException(
                status_code=404,
                detail=f"Scanner {scanner_id} not found. Available devices: {[device[0] for device in devices]}"
            )

        # Open the scanner
        scanner = sane.open(scanner_id)

        # Set scanning parameters
        scanner.mode = 'color'
        scanner.resolution = 300  # DPI

        # Start the scan
        print(f"Starting scan with scanner {scanner_id}...")
        image = scanner.scan()
        print("Scan completed")

        # Convert PIL Image to base64
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()

        # Convert to base64 string
        img_base64 = base64.b64encode(img_byte_arr).decode()

        # close scanner
        sane.exit()

        return JSONResponse(content={"image": img_base64})

    except Exception as e:
        print(f"Scanning error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
