import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Link,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Lightbulb as LightbulbIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';

function About() {
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
        overflow: 'auto',
        height: '100%',
        p: { xs: 2, sm: 3 }
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'divider',
            flex: 1
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            fontWeight: 'bold',
            color: '#FF7F50',
            textAlign: 'center',
            mb: 4
          }}>
            About HealthBuddy
          </Typography>

          <Typography variant="body1" paragraph sx={{ textAlign: 'center', mb: 4 }}>
            HealthBuddy is your personal AI health coach, designed to help you maintain and improve your long-term healthy habits. 
            We believe in making sustainable lifestyle changes through small, consistent steps rather than quick fixes.
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FF7F50', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon /> Our Mission
            </Typography>
            <Typography variant="body1" paragraph>
              To empower individuals to make lasting positive changes in their health and fitness journey through personalized, 
              AI-powered guidance and support.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FF7F50', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FavoriteIcon /> What We Offer
            </Typography>
            <Typography variant="body1" paragraph>
              • Personalized health and fitness guidance<br />
              • Activity tracking and goal setting<br />
              • AI-powered insights and recommendations<br />
              • Support for sustainable lifestyle changes
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FF7F50' }}>
              Have Feedback?
            </Typography>
            <Typography variant="body1" paragraph>
              We'd love to hear from you! Your feedback helps us improve HealthBuddy for everyone.
            </Typography>
            <Link 
              href="mailto:elyliu@gmail.com" 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1,
                color: '#FF7F50',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              <EmailIcon /> elyliu@gmail.com
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default About; 