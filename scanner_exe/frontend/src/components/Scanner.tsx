import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import { Scanner as ScannerType } from "../types/scanner";
import { scannerService } from "../services/scannerService";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface ScanResult {
  status: string;
  message: string;
  image_data?: string;
  format?: string;
  demo?: boolean;
}

const Scanner: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanners, setScanners] = useState<ScannerType[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>("");
  const [isLoadingScanners, setIsLoadingScanners] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    // Handle connection attempts
    const handleConnectionAttempt = () => {
      setConnectionAttempts((prev) => prev + 1);
    };

    // Listen for connection attempts from the service
    window.addEventListener(
      "scannerConnectionAttempt",
      handleConnectionAttempt
    );

    // Initialize connection
    const initializeConnection = async () => {
      try {
        setError(null);
        await scannerService.connect();
        setIsConnected(true);
        await listScanners();
      } catch (err) {
        setError(
          "Failed to connect to scanner service. Please ensure the scanner executable is running."
        );
        setIsConnected(false);
        console.error(err);
      }
    };

    initializeConnection();

    return () => {
      window.removeEventListener(
        "scannerConnectionAttempt",
        handleConnectionAttempt
      );
      scannerService.disconnect();
    };
  }, []);

  const listScanners = async () => {
    if (!isConnected) {
      setError("Scanner service is not connected");
      return;
    }

    setIsLoadingScanners(true);

    try {
      const availableScanners = await scannerService.listScanners();

      // Ensure scanners is always an array
      const scannersArray = Array.isArray(availableScanners)
        ? availableScanners
        : [];

      console.log("Received scanners:", availableScanners);
      console.log("Converted to array:", scannersArray);

      setScanners(scannersArray);

      // Select the first scanner by default if available
      if (scannersArray.length > 0 && !selectedScanner) {
        setSelectedScanner(scannersArray[0].id);
      }
    } catch (err) {
      setError("Failed to retrieve scanner list");
      console.error(err);
    } finally {
      setIsLoadingScanners(false);
    }
  };

  const handleScan = async () => {
    if (!isConnected) {
      setError("Scanner service is not connected");
      return;
    }

    // Validate scanner selection
    if (!selectedScanner) {
      setError("Please select a scanner first");
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      console.log(`Starting scan with scanner ID: ${selectedScanner}`);

      const result = await scannerService.scan({
        scanner_id: selectedScanner,
        resolution: 300,
        color_mode: "color",
      });

      // Convert the scan response to our expected format
      setScanResult({
        status: result.status,
        message: result.message || "",
        image_data: result.image_data,
        format: result.format || "png",
        demo: result.demo,
      });
    } catch (err) {
      setError(
        "Failed to scan document. Please check your scanner connection."
      );
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScannerChange = (event: SelectChangeEvent) => {
    setSelectedScanner(event.target.value);
  };

  // Ensure scanners is an array before mapping
  const scannersToRender = Array.isArray(scanners) ? scanners : [];

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <StyledPaper elevation={3}>
        <Typography variant="h5" component="h2" gutterBottom>
          Document Scanner
        </Typography>

        <Box sx={{ width: "100%", mb: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Scanner</InputLabel>
            <Select
              value={selectedScanner}
              label="Select Scanner"
              onChange={handleScannerChange}
              disabled={isLoadingScanners || scannersToRender.length === 0}
            >
              {scannersToRender.map((scanner) => (
                <MenuItem key={scanner.id} value={scanner.id}>
                  {scanner.name}
                </MenuItem>
              ))}
              {scannersToRender.length === 0 && (
                <MenuItem value="default">Default Scanner</MenuItem>
              )}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleScan}
              disabled={!isConnected || isScanning}
              startIcon={isScanning ? <CircularProgress size={20} /> : null}
            >
              {isScanning ? "Scanning..." : "Scan Document"}
            </Button>

            <Button
              variant="outlined"
              onClick={() => listScanners()}
              disabled={!isConnected || isLoadingScanners}
            >
              Refresh Scanners
            </Button>

            {!isConnected && (
              <Typography color="error">
                Scanner service is not connected
                {connectionAttempts > 0 && ` (Attempt ${connectionAttempts})`}
              </Typography>
            )}
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2, width: "100%" }}>
            {error}
          </Typography>
        )}

        {scanResult?.image_data && (
          <Box sx={{ mt: 3, width: "100%" }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Scanned Document {scanResult.demo ? "(Demo)" : ""}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <img
                src={`data:image/${scanResult.format};base64,${scanResult.image_data}`}
                alt="Scanned document"
                style={{
                  maxWidth: "100%",
                  maxHeight: "600px",
                  objectFit: "contain",
                }}
              />
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                const link = document.createElement("a");
                link.href = `data:image/${scanResult.format};base64,${scanResult.image_data}`;
                link.download = `scan-${new Date().getTime()}.${
                  scanResult.format
                }`;
                link.click();
              }}
            >
              Download
            </Button>
          </Box>
        )}
      </StyledPaper>
    </Box>
  );
};

export default Scanner;
