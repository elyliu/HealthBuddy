import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

function ActivitiesTab({ activities }) {
  const getDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  };

  const getActivitiesInRange = (days) => {
    const { start, end } = getDateRange(days);
    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= start && activityDate <= end;
    });
  };

  const getActivityStats = () => {
    const last7Days = getActivitiesInRange(7);
    const last30Days = getActivitiesInRange(30);
    const last365Days = getActivitiesInRange(365);

    return {
      week: last7Days.length,
      month: last30Days.length,
      year: last365Days.length
    };
  };

  const stats = getActivityStats();

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'white',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
                backgroundSize: '10px 10px',
                opacity: 0.1
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.week}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Last 7 Days
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',
              color: 'white',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
                backgroundSize: '10px 10px',
                opacity: 0.1
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.month}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Last 30 Days
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              color: 'white',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
                backgroundSize: '10px 10px',
                opacity: 0.1
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.year}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Last Year
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Activity Timeline */}
      <Paper 
        elevation={0}
        sx={{ 
          mt: 2,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Activity Timeline
          </Typography>
        </Box>
        <Timeline 
          position="left"
          sx={{ 
            px: 2,
            '& .MuiTimelineItem-root': {
              minHeight: 'auto',
              '&:before': {
                display: 'none'
              }
            },
            '& .MuiTimelineContent-root': {
              flex: 1,
              minWidth: 0,
              textAlign: 'left'
            }
          }}
        >
          {activities.length === 0 ? (
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot 
                  sx={{ 
                    background: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',
                    boxShadow: '0 4px 20px rgba(244, 67, 54, 0.3)'
                  }}
                />
                <TimelineConnector 
                  sx={{ 
                    background: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',
                    opacity: 0.3
                  }}
                />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  No activities recorded yet
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ) : (
            activities.map((activity, index) => (
              <TimelineItem key={activity.id}>
                <TimelineSeparator>
                  <TimelineDot 
                    sx={{ 
                      background: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',
                      boxShadow: '0 4px 20px rgba(244, 67, 54, 0.3)'
                    }}
                  />
                  {index < activities.length - 1 && (
                    <TimelineConnector 
                      sx={{ 
                        background: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',
                        opacity: 0.3
                      }}
                    />
                  )}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                      backdropFilter: 'blur(10px)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ mb: 1, textAlign: 'left' }}>
                      {activity.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <CalendarIcon fontSize="small" />
                      <Typography variant="caption">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))
          )}
        </Timeline>
      </Paper>
    </Box>
  );
}

export default ActivitiesTab; 