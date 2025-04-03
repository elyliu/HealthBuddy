import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Fab,
  Alert
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import AddActivityDialog from './AddActivityDialog';
import ActivityList from './ActivityList';

function ActivitiesTab({ activities, onActivityAdded, onActivityUpdate }) {
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
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        mt: { xs: '80px', sm: '80px' },
        p: { xs: 1, sm: 2 }
      }}
    >
      <Box sx={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Box sx={{ position: 'relative', top: 85, right: 16, zIndex: 1001 }}>
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

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Typography variant="h5" sx={{ mb: 2, color: 'text.primary' }}>
            Your Activities
          </Typography>
          <ActivityList activities={activities} onUpdate={onActivityUpdate} />
        </Box>

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