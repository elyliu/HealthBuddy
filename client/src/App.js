import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import Profile from './components/Profile';
import About from './components/About';
import ActivitiesTab from './components/ActivitiesTab';
import { supabase } from './lib/supabaseClient';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FFB800', // Energetic yellow
      light: '#FFD54F',
      dark: '#FFA000',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FF6B6B', // Coral red for energy
      light: '#FF8A80',
      dark: '#FF5252',
      contrastText: '#000000',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    error: {
      main: '#FF5252',
      light: '#FF867F',
      dark: '#C50E29',
    },
    success: {
      main: '#4CAF50',
      light: '#80E27E',
      dark: '#087F23',
    },
    warning: {
      main: '#FFC107',
      light: '#FFF350',
      dark: '#C79100',
    },
    info: {
      main: '#2196F3',
      light: '#6EC6FF',
      dark: '#0069C0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#FFB800', // Yellow for headings
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#FFB800',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#FFB800',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#FFB800',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#FFB800',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#FFB800',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          '&:hover': {
            backgroundColor: 'rgba(255, 184, 0, 0.1)', // Yellow hover effect
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFB800', // Yellow navbar
          color: '#000000',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#666666',
          '&.Mui-selected': {
            color: '#FFB800', // Yellow for selected items
          },
        },
      },
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchActivities = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for fetching activities');
        return;
      }
      
      console.log('Fetching activities for user:', user.id);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }

      console.log('Successfully fetched activities:', data);
      setActivities(data || []);
    } catch (error) {
      console.error('Error in fetchActivities:', error);
    }
  };

  // New function to handle both local and server updates
  const handleActivityAdded = async (newActivity) => {
    // Update locally first
    if (newActivity) {
      setActivities(prev => [newActivity, ...prev]);
    }
    // Then fetch from server in background
    fetchActivities();
  };

  useEffect(() => {
    if (user) {
      console.log('User changed, fetching activities');
      fetchActivities();
    }
  }, [user]);

  const renderContent = () => {
    switch (currentView) {
      case 'activities':
        return <ActivitiesTab activities={activities} onActivityAdded={handleActivityAdded} />;
      case 'profile':
        return <Profile />;
      case 'about':
        return <About />;
      default:
        return <Chat activities={activities} onActivityAdded={handleActivityAdded} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <Navbar currentView={currentView} onViewChange={setCurrentView} />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1,
              width: '100%',
              paddingTop: { xs: '100px', sm: '100px' }, // Increase padding to ensure content starts below navbar
              paddingBottom: { xs: '20px', sm: '20px' }
            }}
          >
            {renderContent()}
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
