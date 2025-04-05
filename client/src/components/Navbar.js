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
  Star as StarIcon
} from '@mui/icons-material';

function Navbar({ currentView, onViewChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navItems = [
    { label: 'Chat', icon: <ChatIcon />, value: 'chat' },
    { label: 'Activities', icon: <StarIcon />, value: 'activities' },
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
        zIndex: theme.zIndex.appBar,
        height: { xs: '80px', sm: '64px' } // Even taller on mobile
      }}
    >
      <Toolbar 
        sx={{ 
          height: '100%', 
          px: { xs: 2, sm: 3 },
          minHeight: { xs: '80px !important', sm: '64px !important' }, // Match AppBar height
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box 
          component="img" 
          src="/healthbuddy-logo.png" 
          alt="HealthBuddy"
          sx={{
            height: { xs: '70px', sm: '80px' }, // Much larger on mobile
            width: 'auto',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9
            }
          }}
        />
        
        <Box sx={{ flexGrow: 1 }} />
        
        {navItems.map((item) => (
          <IconButton
            key={item.value}
            onClick={() => onViewChange(item.value)}
            sx={{
              ml: { xs: 1, sm: 2 },
              color: currentView === item.value ? 'primary.contrastText' : 'rgba(0,0,0,0.7)',
              bgcolor: currentView === item.value ? 'rgba(0,0,0,0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.1)'
              },
              width: { xs: '40px', sm: '50px' }, // Slightly larger icons on desktop
              height: { xs: '40px', sm: '50px' }
            }}
          >
            {item.icon}
          </IconButton>
        ))}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;