import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { ModelInfo, ocrApi, type ScannerInfo } from "../services/api";
import {
  HighlightAlt as ScanIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";

import Scanner from "./Scanner";

interface ScannerInterfaceProps {
  onScanComplete: (text: string, enhancedText: string) => void;
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
  const [selectedModel, setSelectedModel] = useState<string>("phi3");
  const [languages] = useState<string[]>(["en"]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await ocrApi.getModels();
        setAvailableModels(response.models);
      } catch (err) {
        console.error("Error fetching models:", err);
        setError("Could not fetch available models. Please try again later.");
      }
    };

    fetchModels();
  }, []);

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
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    setSelectedModel(event.target.value);
  };

  const handleScannedImage = (base64Image: string) => {
    setScannedImage(base64Image);
    setSelectedFile(null);
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
        formData.append("file", selectedFile);
        formData.append("model", selectedModel);
        formData.append("languages", JSON.stringify(languages));

        result = await ocrApi.extractText(formData);
      }
      if (scannedImage) {
        result = await ocrApi.scannerExtractText(
          scannedImage,
          selectedModel,
          languages,
          selectedScanner
        );
      }

      if (result) {
        onScanComplete(result.raw_text, result.enhanced_text);
      }
    } catch (err) {
      console.error("Error during OCR processing:", err);
      setError("An error occurred during OCR processing. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Document Scanner
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
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
                  disabled={scanning}
                >
                  {availableModels.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                    Selected Model:{" "}
                    {availableModels.find((m) => m.id === selectedModel)?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {
                      availableModels.find((m) => m.id === selectedModel)
                        ?.description
                    }
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Capabilities:
                  </Typography>
                  <ul>
                    {availableModels
                      .find((m) => m.id === selectedModel)
                      ?.capabilities.map((capability, index) => (
                        <li key={index}>
                          <Typography variant="body2">{capability}</Typography>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
