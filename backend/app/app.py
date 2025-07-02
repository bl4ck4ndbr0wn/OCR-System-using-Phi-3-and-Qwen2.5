from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ocr, scanner

app = FastAPI(
    title="OCR API with Phi-3 and Qwen2.5",
    description="OCR system that integrates Microsoft Phi-3 and Qwen2.5 models for enhanced text extraction",
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

# Scanner API
app.include_router(
    scanner.router,
    prefix="/api/v1/scanner",
    tags=["Scanner API v1"]
)

# OCR API
app.include_router(
    ocr.router,
    prefix="/api/v1/ocr",
    tags=["OCR API v1"]
)


@app.get("/")
async def root():
    return {
        "message": "Welcome to the OCR API with Phi-3 and Qwen2.5 integration",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
