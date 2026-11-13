
import { createTheme } from "@mui/material/styles";

// --------------------------------------------------
// APPLICATION COLOR PALETTE
// --------------------------------------------------

export const palette = {
  bgApp: "#0A0D12",
  bgPanel: "#11161D",
  bgCard: "#161C25",

  border: "#1F2833",

  primary: "#22E06B",
  primaryHover: "#1CC25C",

  cyan: "#22D3EE",

  danger: "#EF4444",
  warning: "#FACC15",

  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#5B6675",

  swatches: {
    red: "#FF2D55",
    orange: "#FF8A1F",
    yellow: "#FFD60A",
    green: "#34D15B",
    cyan: "#00C8FF",
    blue: "#1E5BFF",
    purple: "#9B30FF",
  },
};

// --------------------------------------------------
// TYPOGRAPHY
// --------------------------------------------------

const fontFamily = [
  "Manrope",
  "Segoe UI",
  "Arial",
  "sans-serif",
].join(",");

// --------------------------------------------------
// MUI THEME
// --------------------------------------------------

const theme = createTheme({
  // ----------------------------------------------
  // PALETTE
  // ----------------------------------------------

  palette: {
    mode: "dark",

    primary: {
      main: palette.primary,
      dark: palette.primaryHover,
      contrastText: "#06120A",
    },

    secondary: {
      main: palette.cyan,
      contrastText: "#041216",
    },

    error: {
      main: palette.danger,
    },

    warning: {
      main: palette.warning,
    },

    success: {
      main: palette.primary,
    },

    info: {
      main: palette.cyan,
    },

    background: {
      default: palette.bgApp,
      paper: palette.bgPanel,
    },

    divider: palette.border,

    text: {
      primary: palette.textPrimary,
      secondary: palette.textSecondary,
      disabled: palette.textMuted,
    },
  },

  // ----------------------------------------------
  // SHAPE
  // ----------------------------------------------

  shape: {
    borderRadius: 8,
  },

  // ----------------------------------------------
  // TYPOGRAPHY
  // ----------------------------------------------

  typography: {
    fontFamily,

    fontSize: 13,

    h1: {
      fontFamily,
      fontSize: "2rem",
      fontWeight: 800,
      letterSpacing: "-0.035em",
    },

    h2: {
      fontFamily,
      fontSize: "1.75rem",
      fontWeight: 800,
      letterSpacing: "-0.025em",
    },

    h3: {
      fontFamily,
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },

    h4: {
      fontFamily,
      fontSize: "1.25rem",
      fontWeight: 700,
    },

    h5: {
      fontFamily,
      fontSize: "1.125rem",
      fontWeight: 700,
    },

    h6: {
      fontFamily,
      fontSize: "0.95rem",
      fontWeight: 700,
    },

    subtitle1: {
      fontFamily,
      fontSize: "0.875rem",
      fontWeight: 600,
    },

    subtitle2: {
      fontFamily,
      fontSize: "0.8125rem",
      fontWeight: 600,
    },

    body1: {
      fontFamily,
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.6,
    },

    body2: {
      fontFamily,
      fontSize: "0.8125rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },

    caption: {
      fontFamily,
      fontSize: "0.75rem",
      fontWeight: 500,
      lineHeight: 1.4,
    },

    button: {
      fontFamily,
      fontSize: "0.8125rem",
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
  },

  // ----------------------------------------------
  // COMPONENT CUSTOMIZATION
  // ----------------------------------------------

  components: {
    // ------------------------------------------
    // GLOBAL CSS
    // ------------------------------------------

    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontFamily,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },

        body: {
          backgroundColor: palette.bgApp,
          color: palette.textPrimary,
          fontFamily,
          fontSize: 13,
          margin: 0,
        },

        "*": {
          boxSizing: "border-box",
        },

        "*::-webkit-scrollbar": {
          width: 6,
          height: 6,
        },

        "*::-webkit-scrollbar-track": {
          background: palette.bgApp,
        },

        "*::-webkit-scrollbar-thumb": {
          background: palette.border,
          borderRadius: 8,
        },

        "*::-webkit-scrollbar-thumb:hover": {
          background: palette.textMuted,
        },
      },
    },

    // ------------------------------------------
    // PAPER
    // ------------------------------------------

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: palette.bgPanel,
          border: `1px solid ${palette.border}`,
        },
      },
    },

    // ------------------------------------------
    // CARD
    // ------------------------------------------

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: palette.bgCard,
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          boxShadow: "none",
        },
      },
    },

    // ------------------------------------------
    // BUTTON
    // ------------------------------------------

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          fontFamily,
          fontWeight: 600,
          textTransform: "none",
          borderRadius: 6,
          minHeight: 32,
          transition: "background-color 120ms ease",
        },

        containedPrimary: {
          color: "#06120A",
          boxShadow: "none",

          "&:hover": {
            backgroundColor: palette.primaryHover,
            boxShadow: "none",
          },
        },

        outlinedPrimary: {
          borderColor: palette.primary,

          "&:hover": {
            backgroundColor: "rgba(34, 224, 107, 0.12)",
            borderColor: palette.primary,
          },
        },

        outlinedError: {
          borderColor: palette.danger,
        },

        textPrimary: {
          "&:hover": {
            backgroundColor: "rgba(34, 224, 107, 0.08)",
          },
        },
      },
    },

    // ------------------------------------------
    // ICON BUTTON
    // ------------------------------------------

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: palette.textSecondary,
          borderRadius: 6,

          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.06)",
            color: palette.textPrimary,
          },
        },
      },
    },

    // ------------------------------------------
    // TOGGLE BUTTON
    // ------------------------------------------

    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontFamily,
          fontSize: 12,
          fontWeight: 600,

          borderColor: palette.border,
          color: palette.textSecondary,

          textTransform: "none",

          "&.Mui-selected": {
            backgroundColor: "rgba(34, 224, 107, 0.12)",
            color: palette.primary,
            borderColor: palette.primary,
          },

          "&.Mui-selected:hover": {
            backgroundColor: "rgba(34, 224, 107, 0.18)",
          },
        },
      },
    },

    // ------------------------------------------
    // TEXT FIELD
    // ------------------------------------------

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },

    // ------------------------------------------
    // INPUT
    // ------------------------------------------

    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily,
          fontSize: 13,
        },

        input: {
          fontFamily,
          fontSize: 13,

          "&::placeholder": {
            color: palette.textMuted,
            opacity: 1,
          },
        },
      },
    },

    // ------------------------------------------
    // OUTLINED INPUT
    // ------------------------------------------

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: palette.bgCard,
          borderRadius: 6,

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.border,
          },

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.textMuted,
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.primary,
          },
        },

        input: {
          fontFamily,
          fontSize: 13,
        },
      },
    },

    // ------------------------------------------
    // SELECT
    // ------------------------------------------

    MuiSelect: {
      styleOverrides: {
        select: {
          fontFamily,
          fontSize: 13,
        },

        icon: {
          color: palette.textSecondary,
        },
      },
    },

    // ------------------------------------------
    // MENU
    // ------------------------------------------

    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.bgPanel,
          border: `1px solid ${palette.border}`,
          backgroundImage: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily,
          fontSize: 13,
          minHeight: 34,

          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.05)",
          },

          "&.Mui-selected": {
            backgroundColor: "rgba(34,224,107,0.12)",
            color: palette.primary,
          },
        },
      },
    },

    // ------------------------------------------
    // SLIDER
    // ------------------------------------------

    MuiSlider: {
      styleOverrides: {
        root: {
          color: palette.primary,
          height: 4,
        },

        thumb: {
          width: 14,
          height: 14,
          boxShadow: "none",

          "&:hover": {
            boxShadow: `0 0 0 6px rgba(34,224,107,0.12)`,
          },
        },

        rail: {
          backgroundColor: palette.border,
          opacity: 1,
        },

        track: {
          border: "none",
        },

        valueLabel: {
          fontFamily,
          fontSize: 11,
          fontWeight: 600,
        },
      },
    },

    // ------------------------------------------
    // CHIP
    // ------------------------------------------

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily,
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 5,
        },

        colorSuccess: {
          backgroundColor: "rgba(34,224,107,0.15)",
          color: palette.primary,
        },

        colorError: {
          backgroundColor: "rgba(239,68,68,0.15)",
          color: palette.danger,
        },

        colorWarning: {
          backgroundColor: "rgba(250,204,21,0.15)",
          color: palette.warning,
        },
      },
    },

    // ------------------------------------------
    // TABS
    // ------------------------------------------

    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 36,
        },

        indicator: {
          backgroundColor: palette.primary,
          height: 2,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily,
          fontSize: 12,
          fontWeight: 600,

          minHeight: 36,
          padding: "8px 14px",

          textTransform: "none",

          color: palette.textSecondary,

          "&.Mui-selected": {
            color: palette.primary,
          },
        },
      },
    },

    // ------------------------------------------
    // TOOLTIP
    // ------------------------------------------

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily,
          fontSize: 11,
          fontWeight: 500,

          backgroundColor: "#202833",
          color: palette.textPrimary,

          border: `1px solid ${palette.border}`,
          borderRadius: 5,
        },
      },
    },

    // ------------------------------------------
    // DIVIDER
    // ------------------------------------------

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: palette.border,
        },
      },
    },

    // ------------------------------------------
    // SWITCH
    // ------------------------------------------

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: palette.primary,
          },

          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: palette.primary,
            opacity: 0.5,
          },
        },

        track: {
          backgroundColor: palette.border,
          opacity: 1,
        },
      },
    },

    // ------------------------------------------
    // TABLE
    // ------------------------------------------

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily,
          fontSize: 12,

          borderBottom: `1px solid ${palette.border}`,
        },

        head: {
          fontWeight: 700,
          color: palette.textSecondary,
        },
      },
    },

    // ------------------------------------------
    // DIALOG
    // ------------------------------------------

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.bgPanel,
          backgroundImage: "none",

          border: `1px solid ${palette.border}`,
          borderRadius: 10,
        },
      },
    },

    // ------------------------------------------
    // PROGRESS
    // ------------------------------------------

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 4,
          backgroundColor: palette.border,
        },

        bar: {
          backgroundColor: palette.primary,
        },
      },
    },
  },
});

export default theme;
