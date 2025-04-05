import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Fab,
  Alert,
  Paper
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
        p: { xs: 2, sm: 3 }
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
        {error && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Paper 
          elevation={0} 
          sx={{ 
            p: 2,
            mb: 2,
            bgcolor: 'background.paper',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {/* Weekly Summary */}
          <Typography variant="h5" sx={{ color: 'text.primary' }}>
            Last 7 Days
          </Typography>
          <Typography variant="body1">
            {(() => {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const recentActivities = activities.filter(
                activity => new Date(activity.date) >= sevenDaysAgo
              );
              const count = recentActivities.length;
              const stars = '⭐'.repeat(count);
              return `You've logged ${count} healthy ${count === 1 ? 'activity' : 'activities'}, which earned you ${stars}!`;
            })()}
          </Typography>
        </Paper>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: '12px'
          }}
        >
          <Typography variant="h5" sx={{ color: 'text.primary' }}>
            Your Healthy Activities
          </Typography>
          <Fab
            color="primary"
            aria-label="add activity"
            onClick={() => setShowAddActivity(true)}
            size="medium"
            sx={{
              boxShadow: '0 4px 20px rgba(255, 184, 0, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 25px rgba(255, 184, 0, 0.4)'
              }
            }}
          >
            <AddIcon />
          </Fab>
        </Paper>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
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