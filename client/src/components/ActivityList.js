import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';

const ActivityList = ({ activities, onUpdate }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    date: ''
  });

  const handleEditClick = (activity) => {
    setEditingActivity(activity);
    setEditForm({
      description: activity.description,
      date: activity.date.split('T')[0]
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingActivity(null);
    setEditForm({ description: '', date: '' });
  };

  const handleEditSubmit = async () => {
    try {
      console.log('Updating activity:', {
        id: editingActivity.id,
        form: editForm
      });

      // First get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Failed to get user information');
      }
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Current user:', user.id);

      // First verify the activity exists and belongs to the user
      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', editingActivity.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching activity:', fetchError);
        throw new Error(`Failed to verify activity: ${fetchError.message}`);
      }
      if (!existingActivity) {
        throw new Error('Activity not found or you do not have permission to edit it');
      }

      // Format the date to include time and timezone
      const updateDate = new Date(editForm.date);
      updateDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      const formattedDate = updateDate.toISOString();

      // Perform the update
      const { data, error: updateError } = await supabase
        .from('activities')
        .update({
          description: editForm.description,
          date: formattedDate
        })
        .eq('id', editingActivity.id)
        .eq('user_id', user.id)
        .select('*');

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(`Failed to update activity: ${updateError.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No activity was updated');
      }

      onUpdate(activities.map(activity => 
        activity.id === data[0].id ? data[0] : activity
      ));
      handleEditClose();
    } catch (error) {
      console.error('Error updating activity:', {
        message: error.message,
        error: error,
        stack: error.stack
      });
      alert(error.message || 'Failed to update activity. Please try again.');
    }
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Failed to get user information');
      }
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting activity:', deleteError);
        throw new Error(`Failed to delete activity: ${deleteError.message}`);
      }

      onUpdate(activities.filter(activity => activity.id !== activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert(error.message || 'Failed to delete activity. Please try again.');
    }
  };

  return (
    <>
      <List>
        {activities.map((activity) => (
          <ListItem 
            key={activity.id}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              pr: { xs: '100px', sm: '120px' }, // Make space for buttons
              position: 'relative'
            }}
          >
            <ListItemText
              primary={activity.description}
              secondary={new Date(activity.date).toLocaleDateString()}
              sx={{
                mr: 2,
                '& .MuiTypography-root': {
                  wordBreak: 'break-word' // Allow text to break to prevent overflow
                }
              }}
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                aria-label="edit"
                onClick={() => handleEditClick(activity)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => handleDelete(activity.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={editDialogOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Activity</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            fullWidth
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ActivityList; 