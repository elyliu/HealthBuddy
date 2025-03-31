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
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navbar currentView={currentView} onViewChange={setCurrentView} />
          {renderContent()}
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
