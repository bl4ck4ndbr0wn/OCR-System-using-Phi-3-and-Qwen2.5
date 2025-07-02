import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import Scanner from "./components/Scanner";

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Scanner />
      </Container>
    </ThemeProvider>
  );
}

export default App;
