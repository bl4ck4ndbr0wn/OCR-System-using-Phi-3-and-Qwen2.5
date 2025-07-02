import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Typography,
} from "@mui/material";
import {
  ModelInfo,
  ocrApi,
  type ModelDetails,
  type ScannerInfo,
} from "../services/api";
import {
  HighlightAlt as ScanIcon,
  Upload as UploadIcon,
  Crop as CropIcon,
} from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import Scanner from "./Scanner";

interface ScannerInterfaceProps {
  onScanComplete: (result: {
    rawText: string;
    enhancedText: string;
    modelDetails?: ModelDetails;
    languages?: string[];
    confidence: number;
    processingTime: number;
  }) => void;
}

export default function ScannerInterface({
  onScanComplete,
}: ScannerInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [selectedScanner, setSelectedScanner] = useState<ScannerInfo>({
    id: "",
    name: "",
    vendor: "",
    model: "",
    type: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [languages] = useState<string[]>(["en"]);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [useGpu, setUseGpu] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await ocrApi.getModels();
        setAvailableModels(response.models);
        // Set default model after fetching
        if (response.models.length > 0) {
          setSelectedModel(response.models[0].id);
        }
      } catch (err) {
        console.error("Error fetching models:", err);
        setError("Could not fetch available models. Please try again later.");
      }
    };

    fetchModels();
  }, []);

  const handleCropComplete = () => {
    if (canvasRef.current && imageRef && crop.width && crop.height) {
      const canvas = canvasRef.current;
      const scaleX = imageRef.naturalWidth / imageRef.width;
      const scaleY = imageRef.naturalHeight / imageRef.height;
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(
          imageRef,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width * scaleX,
          crop.height * scaleY
        );

        const croppedImageUrl = canvas.toDataURL("image/jpeg");
        setCroppedImageUrl(croppedImageUrl);
        setPreviewUrl(croppedImageUrl);
        setShowCropDialog(false);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      setSelectedFile(file);
      setScannedImage(null);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCropDialog(true);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    const newModel = event.target.value;
    setSelectedModel(newModel);
    // Reset GPU selection when model changes
    setUseGpu(false);
  };

  const handleGpuChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseGpu(event.target.checked);
  };

  const handleScannedImage = (base64Image: string) => {
    setScannedImage(base64Image);
    setSelectedFile(null);
    setShowCropDialog(true);
    setPreviewUrl(`data:image/png;base64,${base64Image}`);
    setError(null);
  };

  const handleScannerSelect = (scanner: ScannerInfo) => {
    console.log("Scanner selected:", scanner);
    setSelectedScanner(scanner);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleScan = async () => {
    if (!selectedFile && !scannedImage) {
      setError("Please select an image to scan.");
      return;
    }

    setScanning(true);
    setError(null);

    try {
      let result;
      if (selectedFile) {
        const formData = new FormData();
        // Use cropped image if available, otherwise use original file
        if (croppedImageUrl) {
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          formData.append("file", blob, "cropped-image.jpg");
        } else {
          formData.append("file", selectedFile);
        }
        formData.append("model", selectedModel);
        formData.append("languages", JSON.stringify(languages));

        result = await ocrApi.extractText(formData, useGpu);
      }
      if (scannedImage) {
        const formData = new FormData();
        formData.append("image_data", scannedImage);
        formData.append("model", selectedModel);
        formData.append("languages", JSON.stringify(languages));
        formData.append("scanner_info", JSON.stringify(selectedScanner));

        result = await ocrApi.scannerExtractText(formData, useGpu);
      }

      if (result) {
        onScanComplete({
          rawText: result.raw_text,
          enhancedText: result.enhanced_text,
          modelDetails: result.model_details,
          languages: result.languages,
          confidence: result.confidence,
          processingTime: result.processing_time,
        });
      }
    } catch (err) {
      console.error("Error during OCR processing:", err);
      setError("An error occurred during OCR processing. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  // Get the selected model info
  const selectedModelInfo = availableModels.find((m) => m.id === selectedModel);

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          Document Scanner
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Scanner
                onImageScanned={handleScannedImage}
                onScannerSelect={handleScannerSelect}
              />
            </Box>

            <Box
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 2,
                p: 3,
                mb: 2,
                minHeight: 250,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#f9f9f9",
                position: "relative",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 250,
                      objectFit: "contain",
                    }}
                  />
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  >
                    remove
                  </Button>
                </>
              ) : (
                <>
                  <UploadIcon sx={{ fontSize: 60, color: "#999", mb: 2 }} />
                  <Typography variant="body1" align="center">
                    Drag and drop an image here or click to select
                  </Typography>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="model-select-label">Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={selectedModel}
                  label="Model"
                  onChange={handleModelChange}
                  disabled={scanning || availableModels.length === 0}
                >
                  {availableModels.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedModel && selectedModelInfo?.gpu_required && (
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useGpu}
                        onChange={handleGpuChange}
                        disabled={scanning}
                      />
                    }
                    label="Use GPU (if available)"
                  />
                  <FormHelperText>
                    {useGpu
                      ? "GPU will be used if available"
                      : "CPU will be used"}
                  </FormHelperText>
                </FormControl>
              )}
            </Box>

            <Button
              variant="contained"
              startIcon={
                scanning ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ScanIcon />
                )
              }
              onClick={handleScan}
              disabled={(!scannedImage && !selectedFile) || scanning}
              fullWidth
              sx={{ mt: 2 }}
            >
              {scanning ? "Processing..." : "Extract Text"}
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            {selectedModel && availableModels.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Selected Model: {selectedModelInfo?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedModelInfo?.description}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Capabilities:
                  </Typography>
                  <ul>
                    {selectedModelInfo?.capabilities.map(
                      (capability, index) => (
                        <li key={index}>
                          <Typography variant="body2">{capability}</Typography>
                        </li>
                      )
                    )}
                  </ul>
                  {selectedModelInfo?.gpu_required && (
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mt: 2 }}
                    >
                      Note: This model requires GPU for optimal performance
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Crop Dialog */}
      <Dialog
        open={showCropDialog}
        onClose={() => setShowCropDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crop Image</DialogTitle>
        <DialogContent>
          {previewUrl && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCrop(c)}
                aspect={undefined}
              >
                <img
                  src={previewUrl}
                  alt="Crop me"
                  style={{ maxWidth: "100%", maxHeight: "70vh" }}
                  onLoad={(e) => setImageRef(e.currentTarget)}
                />
              </ReactCrop>
            </Box>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCropDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCropComplete}
            variant="contained"
            startIcon={<CropIcon />}
          >
            Crop
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
