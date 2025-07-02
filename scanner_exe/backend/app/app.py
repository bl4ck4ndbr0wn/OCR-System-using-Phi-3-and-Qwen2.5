from pathlib import Path as PathLib
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Path
from fastapi.middleware.cors import CORSMiddleware
from app.services.scanner import ScannerService
import logging
import json
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Scanner Service",
    description="Background scanner service for handling document scanning operations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner_service = ScannerService()

def serialize_response(response_data: Any) -> Dict[str, Any]:
    """Ensure response data is JSON serializable"""
    if hasattr(response_data, "dict") and callable(response_data.dict):
        # If it's a Pydantic model, convert to dict
        return response_data.dict()
    elif hasattr(response_data, "__dict__"):
        # Handle custom classes with __dict__ attribute
        return {k: serialize_response(v) for k, v in response_data.__dict__.items()
                if not k.startswith('_')}
    elif isinstance(response_data, list):
        # Handle lists by converting each item
        return [serialize_response(item) for item in response_data]
    elif isinstance(response_data, dict):
        # Handle dictionaries by converting each value
        return {k: serialize_response(v) for k, v in response_data.items()}
    else:
        # Return primitive types directly
        return response_data

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    logger.info(f"Client connecting with ID: {client_id}")
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            logger.info(f"Received message from client {client_id}: {message.get('action', 'unknown')}")

            if message.get("action") == "scan":
                # Get scan parameters if provided
                scan_data = message.get("data", {})
                scanner_id = scan_data.get("scanner_id", "")
                resolution = scan_data.get("resolution", 300)
                color_mode = scan_data.get("color_mode", "color")

                # Send status update (ping)
                await websocket.send_json({
                    "action": "ping",
                    "status": "Scanning in progress..."
                })

                result = await scanner_service.handle_scan_request(scanner_id, resolution, color_mode)

                # Serialize the result to ensure it's JSON compatible
                serialized_result = serialize_response(result)

                # Add action to the response for the client to recognize it
                serialized_result["action"] = "scan"
                await websocket.send_json(serialized_result)

            elif message.get("action") == "list_scanners":
                scanners = await scanner_service.handle_list_scanners_request()

                # Serialize the scanners list to ensure it's JSON compatible
                serialized_scanners = serialize_response(scanners)

                # Make sure the scanners field is always an array
                if isinstance(serialized_scanners, dict) and "scanners" in serialized_scanners:
                    scanners_data = serialized_scanners["scanners"]
                else:
                    # If we didn't get a proper response structure, use an empty array
                    scanners_data = []

                await websocket.send_json({
                    "action": "list_scanners",
                    "status": "success",
                    "scanners": scanners_data
                })
            else:
                await websocket.send_json({
                    "action": message.get("action", "unknown"),
                    "status": "error",
                    "message": "Unknown action"
                })
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error with client {client_id}: {str(e)}")
        try:
            await websocket.send_json({
                "action": "error",
                "status": "error",
                "message": str(e)
            })
        except:
            logger.error("Could not send error message to client - connection may be closed")

@app.get("/")
async def root():
    return {
        "message": "Scanner Service API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
