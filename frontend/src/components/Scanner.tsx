import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { ScannerInfo, scannerApi } from "../services/api";

interface ScannerProps {
  onImageScanned: (imageData: string) => void;
  onScannerSelect: (scanner: ScannerInfo) => void;
}

const Scanner: React.FC<ScannerProps> = ({
  onImageScanned,
  onScannerSelect,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanners, setScanners] = useState<ScannerInfo[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScanners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await scannerApi.getScannerList();
      setScanners(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scanners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanClick = () => {
    fetchScanners();
    setIsDialogOpen(true);
  };

  const handleScannerSelect = async (scanner: ScannerInfo) => {
    try {
      setIsScanning(true);
      setError(null);
      setIsDialogOpen(false);

      const response = await scannerApi.scanDocument(scanner.id);
      const imageData = response.image;

      onImageScanned(imageData);
      onScannerSelect(scanner);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan document");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="scanner-container">
      <Button
        onClick={handleScanClick}
        disabled={isScanning}
        variant="contained"
        color="primary"
        style={{ marginBottom: "1rem" }}
      >
        {isScanning ? "Scanning..." : "Scan Document"}
      </Button>

      {error && (
        <Typography color="error" style={{ marginTop: "1rem" }}>
          {error}
        </Typography>
      )}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Select Scanner</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "2rem",
              }}
            >
              <CircularProgress />
            </div>
          ) : scanners.length === 0 ? (
            <Typography>No scanners found</Typography>
          ) : (
            <List>
              {scanners.map((scanner) => (
                <ListItem
                  className=""
                  component="div"
                  key={scanner.id}
                  onClick={() => handleScannerSelect(scanner)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemText
                    primary={`${scanner.vendor} ${scanner.model}`}
                    secondary={scanner.name}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Scanner;
