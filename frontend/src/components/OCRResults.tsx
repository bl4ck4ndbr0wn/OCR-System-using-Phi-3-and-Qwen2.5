import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

import { useState } from "react";

interface OCRResultsProps {
  rawText: string;
  enhancedText: string;
}

export default function OCRResults({ rawText, enhancedText }: OCRResultsProps) {
  const [activeTab, setActiveTab] = useState<"raw" | "enhanced">("enhanced");
  const [copied, setCopied] = useState(false);

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

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          OCR Results
        </Typography>

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
        </Box>
      </Paper>
    </Container>
  );
}
