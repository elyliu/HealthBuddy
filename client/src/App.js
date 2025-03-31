import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import Profile from './components/Profile';
import About from './components/About';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF7F50', // Orange from logo
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF4B4B', // Red from heart in logo
      contrastText: '#fff',
    },
    background: {
      default: '#FFE4D6', // Light peach background
      paper: '#fff',
    },
    text: {
      primary: '#2C3E50', // Dark blue-gray
      secondary: '#95A5A6', // Light gray
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#2C3E50',
    },
    h2: {
      fontWeight: 600,
      color: '#2C3E50',
    },
    h3: {
      fontWeight: 600,
      color: '#2C3E50',
    },
    h4: {
      fontWeight: 600,
      color: '#2C3E50',
    },
    h5: {
      fontWeight: 600,
      color: '#2C3E50',
    },
    h6: {
      fontWeight: 600,
      color: '#2C3E50',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('chat');

  const renderContent = () => {
    switch (currentView) {
      case 'profile':
        return <Profile />;
      case 'about':
        return <About />;
      default:
        return <Chat />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navbar currentView={currentView} onViewChange={setCurrentView} />
          {renderContent()}
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
