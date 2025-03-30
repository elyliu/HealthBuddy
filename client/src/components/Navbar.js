import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Info as InfoIcon
} from '@mui/icons-material';

function Navbar({ currentView, onViewChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navItems = [
    { label: 'Chat', icon: <ChatIcon />, value: 'chat' },
    { label: 'Profile', icon: <PersonIcon />, value: 'profile' },
    { label: 'About', icon: <InfoIcon />, value: 'about' }
  ];

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        background: 'linear-gradient(135deg, #FF7F50 0%, #FF6B6B 100%)',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          HealthBuddy
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.value}
              startIcon={item.icon}
              onClick={() => onViewChange(item.value)}
              sx={{
                color: 'white',
                textTransform: 'none',
                fontWeight: currentView === item.value ? 'bold' : 'normal',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              {!isMobile && item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 