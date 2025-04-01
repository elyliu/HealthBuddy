import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  Fab,
  Alert
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import AddActivityDialog from './AddActivityDialog';

function ActivitiesTab({ activities, onActivityAdded }) {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [error] = useState(null);

  // Add effect to log when activities change
  useEffect(() => {
    console.log('Activities updated in ActivitiesTab:', activities);
  }, [activities]);

  const handleActivityAdded = async (newActivity) => {
    console.log('Activity added, calling onActivityAdded with:', newActivity);
    await onActivityAdded(newActivity);
    setShowAddActivity(false);
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pt: 0,
        pb: 2,
        px: { xs: 0, sm: 2 },
        position: 'relative'
      }}
    >
      <Box sx={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        height: '100%'
      }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1001 }}>
          <Fab
            color="error"
            aria-label="add activity"
            onClick={() => setShowAddActivity(true)}
            sx={{
              background: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',
              boxShadow: '0 4px 20px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',
                boxShadow: '0 6px 25px rgba(244, 67, 54, 0.4)'
              }
            }}
          >
            <AddIcon />
          </Fab>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {activities.map((activity, index) => (
            <ListItem 
              key={activity.id || index}
              sx={{ px: 0, py: 1 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  width: '100%',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {activity.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(activity.date).toLocaleDateString()}
                </Typography>
              </Paper>
            </ListItem>
          ))}
        </List>

        <AddActivityDialog
          open={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onActivityAdded={handleActivityAdded}
        />
      </Box>
    </Container>
  );
}

export default ActivitiesTab; 