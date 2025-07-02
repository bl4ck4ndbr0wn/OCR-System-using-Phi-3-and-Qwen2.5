import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Grid,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { ModelDetails } from "./services/api";
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
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: { xs: 2, sm: 3 },
          paddingRight: { xs: 2, sm: 3 },
        },
      },
    },
  },
});

interface OCRResult {
  rawText: string;
  enhancedText: string;
  modelDetails?: ModelDetails;
  languages?: string[];
  confidence: number;
  processingTime: number;
}

function App() {
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [hasResults, setHasResults] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleScanComplete = (result: OCRResult) => {
    setOcrResult(result);
    setHasResults(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: "100vw",
          bgcolor: "background.default",
        }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              component="div"
              sx={{ flexGrow: 1 }}
            >
              OCR System with Phi-3 and Qwen2.5
            </Typography>
          </Toolbar>
        </AppBar>

        <Container
          component="main"
          sx={{
            flexGrow: 1,
            py: { xs: 2, sm: 4 },
            maxWidth: { lg: "1400px" },
          }}
        >
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={12}>
              <ScannerInterface onScanComplete={handleScanComplete} />
            </Grid>
            <Grid item xs={12} md={12}>
              {hasResults && ocrResult ? (
                <OCRResults
                  rawText={ocrResult.rawText}
                  enhancedText={ocrResult.enhancedText}
                  modelDetails={ocrResult.modelDetails}
                  languages={ocrResult.languages}
                  confidence={ocrResult.confidence}
                  processingTime={ocrResult.processingTime}
                />
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 3,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    boxShadow: 3,
                    minHeight: { xs: "300px", md: "100%" },
                  }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    align="center"
                  >
                    OCR results will appear here after processing an image
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>

        <Box
          component="footer"
          sx={{
            py: { xs: 2, sm: 3 },
            px: { xs: 1, sm: 2 },
            mt: "auto",
            backgroundColor: (theme) => theme.palette.grey[200],
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              OCR System with Microsoft Phi-3 and Qwen2.5 Integration
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
