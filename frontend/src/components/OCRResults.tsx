import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Print as PrintIcon,
} from "@mui/icons-material";

import { ModelDetails } from "../services/api";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useState } from "react";

interface OCRResultsProps {
  rawText: string;
  enhancedText: string;
  modelDetails?: ModelDetails;
  languages?: string[];
  confidence: number;
  processingTime: number;
}

export default function OCRResults({
  rawText,
  enhancedText,
  modelDetails,
  languages,
  confidence,
  processingTime,
}: OCRResultsProps) {
  const [activeTab, setActiveTab] = useState<"raw" | "enhanced">("enhanced");
  const [copied, setCopied] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handleTabChange = (
    _: React.SyntheticEvent,
    newValue: "raw" | "enhanced"
  ) => {
    setActiveTab(newValue);
  };

  const handleCopyText = () => {
    const textToCopy = activeTab === "raw" ? rawText : enhancedText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const textToDownload = activeTab === "raw" ? rawText : enhancedText;
    const filename =
      activeTab === "raw" ? "raw-ocr-text.txt" : "enhanced-ocr-text.txt";

    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintClick = () => {
    handlePrint();
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          OCR Results
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ mb: { xs: 2, sm: 3 } }}
        >
          <Chip
            icon={<InfoIcon />}
            label={`Confidence: ${(confidence * 100).toFixed(2)}%`}
            color="primary"
            variant="outlined"
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          />
          <Chip
            icon={<InfoIcon />}
            label={`Processing Time: ${processingTime.toFixed(2)}s`}
            color="primary"
            variant="outlined"
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          />
          {languages && languages.length > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={`Languages: ${languages.join(", ")}`}
              color="primary"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            />
          )}
        </Stack>

        {modelDetails && (
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              Model Details:
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 2 }}
            >
              <Chip
                label={`Model: ${modelDetails.name}`}
                variant="outlined"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              />
              <Chip
                label={`Version: ${modelDetails.version}`}
                variant="outlined"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              />
              <Chip
                label={`Device: ${modelDetails.device}`}
                variant="outlined"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              />
              {modelDetails.gpu_enabled && modelDetails.gpu_name && (
                <Chip
                  label={`GPU: ${modelDetails.gpu_name}`}
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                />
              )}
            </Stack>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Enhanced Text" value="enhanced" />
            <Tab label="Raw OCR Text" value="raw" />
          </Tabs>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={12}
            variant="outlined"
            value={activeTab === "raw" ? rawText : enhancedText}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "monospace" },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyText}
          >
            {copied ? "Copied!" : "Copy Text"}
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadText}
          >
            Download Text
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrintClick}
          >
            Print
          </Button>
        </Box>
      </Paper>

      {/* Printable version */}
      <div style={{ display: "none" }}>
        <div ref={componentRef} style={{ padding: "20px" }}>
          <Typography variant="h4" gutterBottom>
            OCR Results
          </Typography>
          <Typography variant="h6" gutterBottom>
            {activeTab === "raw" ? "Raw OCR Text" : "Enhanced Text"}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          >
            {activeTab === "raw" ? rawText : enhancedText}
          </Typography>
        </div>
      </div>
    </Container>
  );
}
