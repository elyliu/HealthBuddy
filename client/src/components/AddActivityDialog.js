import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';

function AddActivityDialog({ open, onClose }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    if (!description) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Getting current user...');
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      console.log('Current user:', user);

      // Insert the activity
      console.log('Inserting activity with data:', {
        user_id: user.id,
        description: description,
        date: new Date().toISOString()
      });

      const { data, error: insertError } = await supabase
        .from('activities')
        .insert([
          {
            user_id: user.id,
            description: description,
            date: new Date().toISOString()
          }
        ])
        .select();

      if (insertError) {
        console.error('Error inserting activity:', insertError);
        throw insertError;
      }

      console.log('Activity inserted successfully:', data);

      // Clear form and close dialog
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to add activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Activity</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="What did you do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Examples:
• Lifted weights for 40 minutes
• Drank black coffee instead of sugary drink
• Walked the dogs for 30 minutes
• Did 20 push-ups
• Ate a healthy salad for lunch
• Meditated for 10 minutes
• Took the stairs instead of elevator"
            helperText="Describe any healthy activity or choice you made"
          />

          {error && (
            <Box sx={{ color: 'error.main', mt: 1 }}>
              {error}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Activity'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddActivityDialog; 