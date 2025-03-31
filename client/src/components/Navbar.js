import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  FitnessCenter as FitnessCenterIcon
} from '@mui/icons-material';

function Navbar({ currentView, onViewChange }) {

  const navItems = [
    { label: 'Chat', icon: <ChatIcon />, value: 'chat' },
    { label: 'Activities', icon: <FitnessCenterIcon />, value: 'activities' },
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
      <Toolbar sx={{ 
          p: 0,
          pl: { xs: 2, sm: 2 },
          minHeight: '80px !important'
        }}>
        <Box 
          component="img"
          src="/healthbuddy-logo.png"
          alt="HealthBuddy"
          sx={{ 
            height: 100,
            width: 'auto',
            mr: 1,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9
            }
          }}
          onClick={() => onViewChange('chat')}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <IconButton
              key={item.value}
              onClick={() => onViewChange(item.value)}
              sx={{
                color: 'white',
                textTransform: 'none',
                fontWeight: currentView === item.value ? 'bold' : 'normal',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
                ...(currentView === item.value && {
                  background: 'rgba(255, 255, 255, 0.1)',
                })
              }}
            >
              {item.icon}
            </IconButton>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 