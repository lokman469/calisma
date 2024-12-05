import { createTheme } from '@mui/material/styles';

// Renk paleti
const palette = {
  primary: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrastText: '#fff'
  },
  secondary: {
    main: '#F50057',
    light: '#FF4081',
    dark: '#C51162',
    contrastText: '#fff'
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F'
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00'
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2'
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C'
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)'
  },
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF'
  },
  divider: 'rgba(0, 0, 0, 0.12)'
};

// Tipografi
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 500,
    lineHeight: 1.2
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.3
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    textTransform: 'none'
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    textTransform: 'uppercase'
  }
};

// Şekil
const shape = {
  borderRadius: 8
};

// Geçişler
const transitions = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  }
};

// Gölgeler
const shadows = [
  'none',
  '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
  '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
  '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
  '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
  '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
  '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
  '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
  '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
  '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
  '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
  '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
  '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
  '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
  '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
  '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
  '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)'
];

// Bileşen override'ları
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none'
      }
    }
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none'
      }
    }
  }
};

// Ana tema oluştur
const theme = createTheme({
  palette,
  typography,
  shape,
  transitions,
  shadows,
  components
});

export default theme; 