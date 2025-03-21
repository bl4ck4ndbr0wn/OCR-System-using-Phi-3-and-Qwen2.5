import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from "@mui/material";

import OCRResults from "./components/OCRResults";
import ScannerInterface from "./components/ScannerInterface";
import { useState } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  const [rawText, setRawText] = useState<string>("");
  const [enhancedText, setEnhancedText] = useState<string>("");
  const [hasResults, setHasResults] = useState(false);

  const handleScanComplete = (raw: string, enhanced: string) => {
    setRawText(raw);
    setEnhancedText(enhanced);
    setHasResults(true);
  };

  console.log("Raw text:", rawText);
  console.log("Enhanced text:", enhancedText);
  console.log("Has results:", hasResults);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              OCR System with Phi-3 and Qwen2.5
            </Typography>
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
          <ScannerInterface onScanComplete={handleScanComplete} />

          {hasResults && (
            <OCRResults rawText={rawText} enhancedText={enhancedText} />
          )}
        </Container>

        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: "auto",
            backgroundColor: (theme) => theme.palette.grey[200],
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center">
              OCR System with Microsoft Phi-3 and Qwen2.5 Integration
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
