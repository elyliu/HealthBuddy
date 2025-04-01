import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  FitnessCenter as FitnessCenterIcon
} from '@mui/icons-material';

function Navbar({ currentView, onViewChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navItems = [
    { label: 'Chat', icon: <ChatIcon />, value: 'chat' },
    { label: 'Activities', icon: <FitnessCenterIcon />, value: 'activities' },
    { label: 'Profile', icon: <PersonIcon />, value: 'profile' },
    { label: 'About', icon: <InfoIcon />, value: 'about' }
  ];

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        background: 'linear-gradient(135deg, #FFB800 0%, #FFA000 100%)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar
      }}
    >
      <Toolbar 
        disableGutters
        sx={{ 
          minHeight: { xs: '80px !important', sm: '80px !important' },
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box 
          component="img"
          src="/healthbuddy-logo.png"
          alt="HealthBuddy"
          sx={{ 
            height: { xs: 40, sm: 80 },
            width: 'auto',
            mr: 1,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9
            }
          }}
          onClick={() => onViewChange('chat')}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <IconButton
              key={item.value}
              onClick={() => onViewChange(item.value)}
              sx={{
                color: '#000000',
                textTransform: 'none',
                fontWeight: currentView === item.value ? 'bold' : 'normal',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.1)',
                },
                ...(currentView === item.value && {
                  background: 'rgba(0, 0, 0, 0.1)',
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