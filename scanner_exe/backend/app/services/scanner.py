import io
import platform
import logging
from typing import List, Optional
from PIL import Image
from fastapi import HTTPException
from app.types.scanner import Scanner, ListScannersResponse, ScanRequest, ScanResponse
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScannerInterface:
    """Abstract base class defining scanner interface"""
    def get_scanners(self) -> List[Scanner]:
        raise NotImplementedError

    async def scan(self, scanner_id: str, resolution: int, color_mode: str) -> Optional[Image.Image]:
        raise NotImplementedError

class SaneScanner(ScannerInterface):
    """SANE scanner implementation for Linux"""
    def get_scanners(self) -> List[Scanner]:
        try:
            import sane
            sane.init()
            devices = sane.get_devices()

            scanners = [
                Scanner(
                    id=device[0] if len(device) > 0 else "Unknown",
                    name=device[1] if len(device) > 1 else "Unknown",
                    manufacturer=device[2] if len(device) > 2 else "Unknown",
                    model=device[3] if len(device) > 3 else "Unknown",
                    type=device[4] if len(device) > 4 else "Unknown"
                )
                for device in devices
            ]
            sane.exit()
            return scanners
        except Exception as e:
            logger.error(f"Error getting SANE scanners: {str(e)}")
            return []

    async def scan(self, scanner_id: str, resolution: int, color_mode: str) -> Optional[Image.Image]:
        try:
            import sane
            sane.init()
            devices = sane.get_devices()

            if not any(device[0] == scanner_id for device in devices):
                logger.error(f"Scanner {scanner_id} not found. Available devices: {[device[0] for device in devices]}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Scanner {scanner_id} not found. Available devices: {[device[0] for device in devices]}"
                )

            logger.info(f"Opening scanner {scanner_id}...")
            scanner = sane.open(scanner_id)

            logger.info("Setting scanner parameters...")
            scanner.mode = color_mode
            scanner.resolution = resolution

            logger.info(f"Starting scan with scanner {scanner_id}...")
            try:
                image = scanner.scan()
                logger.info("Scan completed successfully")
                return image
            except Exception as scan_error:
                logger.error(f"Error during scanning: {str(scan_error)}")
                sane.exit()
                return None

        except Exception as e:
            logger.error(f"Error scanning with SANE: {str(e)}")
            try:
                sane.exit()
            except:
                pass
            return None

class TwainScanner(ScannerInterface):
    """TWAIN scanner implementation for Windows"""
    def get_scanners(self) -> List[Scanner]:
        try:
            import twain
            source_manager = twain.SourceManager()
            sources = source_manager.GetSourceList()

            scanners = []
            for source in sources:
                try:
                    source_info = source_manager.GetSourceInfo(source)
                    scanners.append(Scanner(
                        id=source,
                        name=source_info.get('ProductName', 'Unknown'),
                        manufacturer=source_info.get('Manufacturer', 'Unknown'),
                        model=source_info.get('ProductFamily', 'Unknown'),
                        type='TWAIN'
                    ))
                except Exception as e:
                    logger.error(f"Error getting TWAIN source info for {source}: {str(e)}")
                    continue

            return scanners
        except Exception as e:
            logger.error(f"Error getting TWAIN scanners: {str(e)}")
            return []

    async def scan(self, scanner_id: str, resolution: int, color_mode: str) -> Optional[Image.Image]:
        try:
            import twain
            source_manager = twain.SourceManager()
            source = source_manager.OpenSource(scanner_id)

            source.SetResolution(resolution)
            if color_mode == 'color':
                source.SetPixelType(twain.TWTY_UINT8, 3)  # RGB
            elif color_mode == 'grayscale':
                source.SetPixelType(twain.TWTY_UINT8, 1)  # Grayscale
            else:  # black_and_white
                source.SetPixelType(twain.TWTY_UINT8, 1)  # Grayscale
                source.SetThreshold(128)  # Convert to black and white

            source.RequestAcquire()
            image = source.GetImage()
            source.Destroy()
            return image
        except Exception as e:
            logger.error(f"Error scanning with TWAIN: {str(e)}")
            return None

class ScannerFactory:
    """Factory for creating appropriate scanner implementation"""
    @staticmethod
    def create_scanner() -> ScannerInterface:
        system = platform.system().lower()
        if system == "windows":
            return TwainScanner()
        return SaneScanner()

class ImageConverter:
    """Handles image format conversions"""
    @staticmethod
    def to_base64(image: Image.Image) -> str:
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        img_base64 = base64.b64encode(img_byte_arr).decode()
        logger.info(f"Image base64: {img_base64}")
        return img_base64

class ScannerService:
    """High level scanner service handling requests"""
    def __init__(self):
        self.scanner = ScannerFactory.create_scanner()
        self.image_converter = ImageConverter()

    async def handle_list_scanners_request(self) -> ListScannersResponse:
        try:
            scanners = self.scanner.get_scanners()
            return ListScannersResponse(scanners=scanners)
        except Exception as e:
            logger.error(f"Error listing scanners: {str(e)}")
            return ListScannersResponse(scanners=[])

    async def handle_scan_request(self, scanner_id: str, resolution: int, color_mode: str) -> ScanResponse:
        try:
            logger.info(f"Starting scan request for scanner {scanner_id}")

            image = await self.scanner.scan(
                scanner_id,
                resolution,
                color_mode
            )


            if image:
                logger.info("Converting scanned image to base64...")
                image_data = self.image_converter.to_base64(image)
                return ScanResponse(
                    success=True,
                    message="Scan completed successfully",
                    image_data=image_data
                )

            return ScanResponse(
                success=False,
                message="Failed to acquire image from scanner. Please check if the scanner is properly connected and try again."
            )

        except Exception as e:
            logger.error(f"Error during scanning: {str(e)}")
            return ScanResponse(
                success=False,
                message=f"Scan failed: {str(e)}"
            )
