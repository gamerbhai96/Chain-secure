import { createTheme } from '@mui/material/styles';
import type { ThemeOptions, PaletteOptions } from '@mui/material/styles';

// ChainSecure Clean Enterprise Design Tokens 2024
export const tokens = {
  colors: {
    primary: '#0ea5e9', // Trustworthy Sky blue, kept as an accent but not overloaded
    primaryDark: '#0284c7',
    secondary: '#1e293b', // Slate dark
    accent: '#10b981', // Emerald
    accentDark: '#059669',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: '#64748b',
    
    // Dark theme colors
    darkBg: '#09090b', // Zinc 950 - deeper, cleaner black
    darkSurface: '#18181b', // Zinc 900
    darkSurfaceLight: '#27272a', // Zinc 800
    darkText: '#fafafa', // Zinc 50
    darkTextSecondary: '#a1a1aa', // Zinc 400
    darkBorder: '#27272a',
    
    // Light theme colors
    lightBg: '#f8fafc', // Slate 50
    lightSurface: '#ffffff',
    lightSurfaceAlt: '#f1f5f9', // Slate 100
    lightText: '#0f172a', // Slate 900
    lightTextSecondary: '#475569', // Slate 600
    lightBorder: '#e2e8f0', // Slate 200
  },
  typography: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    heading: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
};

const modernPalette: PaletteOptions = {
  primary: { 
    main: tokens.colors.primary, 
    light: '#38bdf8', 
    dark: tokens.colors.primaryDark, 
    contrastText: '#ffffff' 
  },
  secondary: { 
    main: tokens.colors.secondary, 
    light: '#475569', 
    dark: '#0f172a', 
    contrastText: '#ffffff' 
  },
  success: { 
    main: tokens.colors.success, 
    light: '#34d399', 
    dark: '#059669' 
  },
  warning: { 
    main: tokens.colors.warning, 
    light: '#fbbf24', 
    dark: '#d97706' 
  },
  error: { 
    main: tokens.colors.danger, 
    light: '#f87171', 
    dark: '#dc2626' 
  },
  info: { 
    main: tokens.colors.primary, 
    light: '#38bdf8', 
    dark: '#0284c7' 
  },
};

const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: tokens.typography.body,
    h1: {
      fontFamily: tokens.typography.display,
      fontSize: 'clamp(2.5rem, 7vw, 4rem)',
      fontWeight: 700,
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
    },
    h2: {
      fontFamily: tokens.typography.heading,
      fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: tokens.typography.heading,
      fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: { 
      fontFamily: tokens.typography.heading, 
      fontSize: '1.15rem', 
      fontWeight: 600 
    },
    h5: { 
      fontFamily: tokens.typography.heading, 
      fontSize: '1rem', 
      fontWeight: 600 
    },
    h6: { 
      fontFamily: tokens.typography.heading, 
      fontSize: '0.875rem', 
      fontWeight: 600, 
      letterSpacing: '0.02em' 
    },
    button: { 
      textTransform: 'none', 
      fontWeight: 500, 
      fontFamily: tokens.typography.body,
    },
    body1: { 
      lineHeight: 1.6,
      fontFamily: tokens.typography.body,
    },
    body2: { 
      lineHeight: 1.5, 
      fontSize: '0.875rem',
      fontFamily: tokens.typography.body,
    },
  },
  shape: { 
    borderRadius: parseInt(tokens.borderRadius.md)
  },
  transitions: {
    duration: {
      shortest: 100,
      shorter: 150,
      short: 200,
      standard: 250,
      complex: 300,
      enteringScreen: 200,
      leavingScreen: 150,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.16, 1, 0.3, 1)', // Sharp, linear-like easing
      easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
      easeIn: 'cubic-bezier(0.16, 1, 0.3, 1)',
      sharp: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.md,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { 
            boxShadow: 'none',
            transform: 'none', // Removed vertical translation
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          boxShadow: tokens.shadows.sm,
          '&:hover': { 
            boxShadow: tokens.shadows.sm,
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': { 
            borderWidth: '1px', 
          },
        },
      },
      defaultProps: {
        disableElevation: true, // Disable MUI default shadow elevation
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          boxShadow: tokens.shadows.sm,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundImage: 'none',
          '&:hover': {
            transform: 'none',
            boxShadow: tokens.shadows.md,
          },
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.borderRadius.md,
            fontFamily: tokens.typography.mono,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            '&:hover fieldset': {
              borderColor: tokens.colors.neutral,
            },
            '&.Mui-focused fieldset': {
              borderWidth: '1px',
            }
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.sm,
          fontWeight: 500,
          fontSize: '0.75rem',
          transition: 'all 0.15s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          boxShadow: tokens.shadows.md,
          backgroundImage: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.md + ' !important',
          boxShadow: 'none',
          '&:before': { display: 'none' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundImage: 'none',
        },
      },
    },
  },
};

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    ...modernPalette,
    background: { 
      default: tokens.colors.darkBg, 
      paper: tokens.colors.darkSurface 
    },
    text: { 
      primary: tokens.colors.darkText, 
      secondary: tokens.colors.darkTextSecondary 
    },
    divider: tokens.colors.darkBorder,
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          background: tokens.colors.darkSurface,
          border: '1px solid ' + tokens.colors.darkBorder,
          boxShadow: tokens.shadows.sm,
          '&:hover': {
            boxShadow: tokens.shadows.md,
            borderColor: tokens.colors.darkTextSecondary,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiTextField?.styleOverrides?.root,
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.borderRadius.md,
            fontFamily: tokens.typography.mono,
            background: tokens.colors.darkBg,
            '& fieldset': { 
              borderColor: tokens.colors.darkBorder, 
              borderWidth: '1px' 
            },
            '&:hover fieldset': { 
              borderColor: tokens.colors.darkTextSecondary 
            },
            '&.Mui-focused fieldset': { 
              borderColor: tokens.colors.primary, 
              borderWidth: '1px',
              boxShadow: `0 0 0 1px ${tokens.colors.primary}`,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          background: tokens.colors.darkSurface,
          border: '1px solid ' + tokens.colors.darkBorder,
          boxShadow: tokens.shadows.md,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...baseTheme.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          background: tokens.colors.primary,
          color: '#ffffff',
          '&:hover': { 
            background: tokens.colors.primaryDark,
          },
        },
        outlinedPrimary: {
          borderColor: tokens.colors.darkBorder,
          color: tokens.colors.darkText,
          '&:hover': { 
            background: tokens.colors.darkSurfaceLight, 
            borderColor: tokens.colors.darkTextSecondary 
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: tokens.colors.darkBg,
          borderBottom: '1px solid ' + tokens.colors.darkBorder,
          boxShadow: 'none',
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    ...modernPalette,
    background: { 
      default: tokens.colors.lightBg, 
      paper: tokens.colors.lightSurface 
    },
    text: { 
      primary: tokens.colors.lightText, 
      secondary: tokens.colors.lightTextSecondary 
    },
    divider: tokens.colors.lightBorder,
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          background: tokens.colors.lightSurface,
          border: '1px solid ' + tokens.colors.lightBorder,
          boxShadow: tokens.shadows.sm,
          '&:hover': {
            boxShadow: tokens.shadows.md,
            borderColor: '#cbd5e1',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiTextField?.styleOverrides?.root,
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.borderRadius.md,
            fontFamily: tokens.typography.mono,
            background: tokens.colors.lightBg,
            '& fieldset': { 
              borderColor: tokens.colors.lightBorder, 
              borderWidth: '1px' 
            },
            '&:hover fieldset': { 
              borderColor: '#cbd5e1' 
            },
            '&.Mui-focused fieldset': { 
              borderColor: tokens.colors.primary, 
              borderWidth: '1px',
              boxShadow: `0 0 0 1px ${tokens.colors.primary}`,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          background: tokens.colors.lightSurface,
          border: '1px solid ' + tokens.colors.lightBorder,
          boxShadow: tokens.shadows.sm,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...baseTheme.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          background: tokens.colors.primary,
          color: '#ffffff',
          '&:hover': { 
            background: tokens.colors.primaryDark,
          },
        },
        outlinedPrimary: {
          borderColor: tokens.colors.lightBorder,
          color: tokens.colors.lightText,
          '&:hover': { 
            background: tokens.colors.lightSurfaceAlt, 
            borderColor: '#cbd5e1' 
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: tokens.colors.lightSurface,
          borderBottom: '1px solid ' + tokens.colors.lightBorder,
          boxShadow: 'none',
        },
      },
    },
  },
});

export type Theme = typeof darkTheme;
