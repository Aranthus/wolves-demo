import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import CommunityBoard from './components/CommunityBoard';
import Feed from './components/Feed';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MemberDetail from './components/MemberDetail';
import PrivateRoute from './components/PrivateRoute';
import Calendar from './components/Calendar';
import Trenches from './components/Trenches';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6E3AD3',
      light: '#9D5CE9',
      dark: '#5B21B6',
      contrastText: '#fff'
    },
    secondary: {
      main: '#9D5CE9',
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#fff'
    },
    background: {
      default: '#1a0b2e',
      paper: 'rgba(35, 11, 52, 0.9)'
    },
    text: {
      primary: '#fff',
      secondary: '#b7a5d1',
      disabled: '#8b7aa8'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      background: 'linear-gradient(135deg, #9D5CE9 0%, #6E3AD3 100%)',
      backgroundClip: 'text',
      textFillColor: 'transparent',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#fff'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#fff'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#fff'
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      color: '#fff'
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      color: '#fff'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
      color: '#b7a5d1'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#8b7aa8'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          backgroundColor: '#1a0b2e'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          transition: 'all 0.3s ease'
        },
        contained: {
          background: 'linear-gradient(135deg, #6E3AD3 0%, #9D5CE9 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
            transform: 'translateY(-2px)'
          }
        },
        outlined: {
          borderColor: '#6E3AD3',
          color: '#6E3AD3',
          '&:hover': {
            borderColor: '#9D5CE9',
            color: '#9D5CE9',
            background: 'rgba(110, 58, 211, 0.1)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(35, 11, 52, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(110, 58, 211, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 32px rgba(110, 58, 211, 0.2)',
            borderColor: 'rgba(110, 58, 211, 0.3)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(110, 58, 211, 0.3)'
            },
            '&:hover fieldset': {
              borderColor: 'rgba(110, 58, 211, 0.5)'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6E3AD3'
            }
          }
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<CommunityBoard />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/wolves-info-hub" element={<Trenches />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/members" element={<CommunityBoard />} />
          <Route path="/member/:id" element={<MemberDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/new-content" element={
            <PrivateRoute>
              <CommunityBoard newContent={true} />
            </PrivateRoute>
          } />
          <Route path="/edit-profile" element={
            <PrivateRoute>
              <MemberDetail edit={true} />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
