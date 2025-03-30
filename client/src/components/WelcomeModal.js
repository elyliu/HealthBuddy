import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box
} from '@mui/material';
import {
  EmojiEvents as GoalsIcon,
  Lightbulb as TipsIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

function WelcomeModal({ open, onClose }) {

  React.useEffect(() => {
    // console.log('WelcomeModal mounted');
    return () => {
      // console.log('WelcomeModal unmounted');
    };
  }, []);

  React.useEffect(() => {
    // console.log('WelcomeModal open state changed:', open);
  }, [open]);

  // Don't render anything if not open
  if (!open) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      keepMounted
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #FFE4D6 0%, #FFF5F0 100%)',
          border: '1px solid',
          borderColor: 'divider'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center',
        color: '#FF7F50',
        fontWeight: 'bold',
        fontSize: '1.5rem'
      }}>
        Welcome to HealthBuddy! 🎉
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          I'm your AI health coach, and I'm here to help you achieve your health and fitness goals.
        </Typography>

        <Typography variant="h6" sx={{ mb: 2, color: '#FF7F50' }}>
          Here's what you can do to get started:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <GoalsIcon sx={{ color: '#FF7F50' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Set Your Health Goals"
              secondary="Add your health and fitness goals in the Profile tab. This helps me provide personalized advice."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TipsIcon sx={{ color: '#FF7F50' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Add Important Health Notes"
              secondary="Share any health conditions, allergies, or preferences in the Profile tab."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ChatIcon sx={{ color: '#FF7F50' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Track Your Activities"
              secondary="Use the chat to log your workouts, meals, and other healthy activities. The more you track, the better I can help!"
            />
          </ListItem>
        </List>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Remember: Small, consistent changes lead to big results! 🌱
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #FF7F50 0%, #FF6B6B 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF7F50 100%)',
            },
            px: 4,
            py: 1
          }}
        >
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WelcomeModal; 