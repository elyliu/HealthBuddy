import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ReactComponent as Logo } from '../assets/logo.svg';

function Navbar() {
  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        <Box 
          component={RouterLink} 
          to="/" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <Logo 
            style={{ 
              width: '40px', 
              height: '40px',
              marginRight: '10px'
            }} 
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: '#2C3E50',
              '& .health': { color: '#2C3E50' },
              '& .buddy': { color: '#95A5A6' }
            }}
          >
            <span className="health">Health</span>
            <span className="buddy">Buddy</span>
          </Typography>
        </Box>

        <Box sx={{ marginLeft: 'auto' }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ 
              mx: 1,
              color: '#2C3E50',
              '&:hover': {
                backgroundColor: 'rgba(44, 62, 80, 0.1)'
              }
            }}
          >
            Home
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/profile"
            sx={{ 
              mx: 1,
              color: '#2C3E50',
              '&:hover': {
                backgroundColor: 'rgba(44, 62, 80, 0.1)'
              }
            }}
          >
            Profile
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 