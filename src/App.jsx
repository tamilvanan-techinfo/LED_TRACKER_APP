
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import theme from "./utils/theme";
import AppBar from "./components/AppBar";
import Dashboard from "./screen/Dashboard";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar />

      <Dashboard />
    </ThemeProvider>
  );
}
