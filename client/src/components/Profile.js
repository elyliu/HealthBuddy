import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';

function Profile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [goals, setGoals] = useState([]);
  const [openGoalDialog, setOpenGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalText, setGoalText] = useState('');
  const [reminders, setReminders] = useState('');
  const [openReminderDialog, setOpenReminderDialog] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      try {
        console.log('Checking user session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          throw error;
        }
        
        console.log('Session check result:', session ? 'Session found' : 'No session');
        if (session) {
          setIsAuthenticated(true);
          setUser(session.user);
          fetchGoals(session.user.id);
          fetchReminders(session.user.id);
        }
      } catch (error) {
        console.error('Error checking session:', error.message);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session present' : 'No session');
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchGoals(session.user.id);
        fetchReminders(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchGoals = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchReminders = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_reminders')
        .select('reminders')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setReminders(data?.reminders || '');
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleOpenGoalDialog = (goal = null) => {
    setEditingGoal(goal);
    setGoalText(goal?.goal_text || '');
    setOpenGoalDialog(true);
  };

  const handleCloseGoalDialog = () => {
    setOpenGoalDialog(false);
    setEditingGoal(null);
    setGoalText('');
  };

  const handleSaveGoal = async () => {
    try {
      console.log('Starting save goal process...');
      console.log('Current user:', user);
      console.log('Goal text:', goalText);
      console.log('Is editing:', !!editingGoal);

      if (!user?.id) {
        console.error('No user ID found');
        throw new Error('User not authenticated');
      }

      if (editingGoal) {
        console.log('Updating existing goal:', editingGoal.id);
        const { data: updateData, error: updateError } = await supabase
          .from('goals')
          .update({ goal_text: goalText })
          .eq('id', editingGoal.id)
          .select();

        if (updateError) {
          console.error('Update error details:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          throw updateError;
        }
        console.log('Goal updated successfully:', updateData);
        setGoals(goals.map(goal => 
          goal.id === editingGoal.id ? { ...goal, goal_text: goalText } : goal
        ));
      } else {
        console.log('Creating new goal...');
        const { data: insertData, error: insertError } = await supabase
          .from('goals')
          .insert([{ 
            goal_text: goalText,
            user_id: user.id
          }])
          .select();

        if (insertError) {
          console.error('Insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          throw insertError;
        }
        console.log('New goal created:', insertData);
        setGoals([insertData[0], ...goals]);
      }
      handleCloseGoalDialog();
      setSuccess('Goal saved successfully!');
    } catch (error) {
      console.error('Error in handleSaveGoal:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      setError(error.message || 'Failed to save goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      setGoals(goals.filter(goal => goal.id !== goalId));
      setSuccess('Goal deleted successfully!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal. Please try again.');
    }
  };

  const handleOpenReminderDialog = () => {
    setOpenReminderDialog(true);
  };

  const handleCloseReminderDialog = () => {
    setOpenReminderDialog(false);
  };

  const handleSaveReminders = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // First check if a record exists
      const { data: existingReminder, error: fetchError } = await supabase
        .from('user_reminders')
        .select()
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw fetchError;
      }

      let error;
      if (existingReminder) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_reminders')
          .update({ reminders: reminders })
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_reminders')
          .insert({ user_id: user.id, reminders: reminders });
        error = insertError;
      }

      if (error) throw error;
      handleCloseReminderDialog();
      setSuccess('Reminders saved successfully!');
    } catch (error) {
      console.error('Error saving reminders:', error);
      setError('Failed to save reminders. Please try again.');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        });

        if (authError) throw authError;

        // Create profile for new user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              name: name,
              email: email,
              has_seen_welcome: false
            }
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw profileError;
        }

        setSuccess('Please check your email for verification link!');
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Attempting sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      setIsAuthenticated(false);
      setUser(null);
      setGoals([]);
      setReminders('');
      setSuccess('Successfully signed out!');
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  if (isAuthenticated) {
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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {user?.user_metadata?.name || 'User'}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              {user?.email}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Your Goals</Typography>
              <IconButton onClick={() => handleOpenGoalDialog()} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            <List>
              {goals.map((goal) => (
                <ListItem
                  key={goal.id}
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" onClick={() => handleOpenGoalDialog(goal)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDeleteGoal(goal.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText primary={goal.goal_text} />
                </ListItem>
              ))}
              {goals.length === 0 && (
                <ListItem>
                  <ListItemText primary="No goals yet. Add one to get started!" />
                </ListItem>
              )}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Things I Should Keep in Mind</Typography>
              <IconButton onClick={handleOpenReminderDialog} color="primary">
                <EditIcon />
              </IconButton>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
              <Typography>
                {reminders || 'No reminders set. Click the edit button to add some!'}
              </Typography>
            </Paper>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Button
            variant="contained"
            color="error"
            onClick={handleSignOut}
            fullWidth
            sx={{ mt: 2 }}
          >
            Sign Out
          </Button>
        </Box>

        <Dialog open={openGoalDialog} onClose={handleCloseGoalDialog}>
          <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Goal"
              fullWidth
              multiline
              rows={4}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseGoalDialog}>Cancel</Button>
            <Button onClick={handleSaveGoal} variant="contained" disabled={!goalText.trim()}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openReminderDialog} onClose={handleCloseReminderDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Reminders</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Things I Should Keep in Mind"
              fullWidth
              multiline
              rows={6}
              value={reminders}
              onChange={(e) => setReminders(e.target.value)}
              placeholder="Enter your reminders here. These will be shared with your AI health buddy to provide more personalized guidance."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReminderDialog}>Cancel</Button>
            <Button onClick={handleSaveReminders} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

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
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ m: 2 }}>{success}</Alert>
        )}
        <Typography variant="h5" gutterBottom align="center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Typography>

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
            />
          )}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isSignUp ? (
              'Sign Up'
            ) : (
              'Sign In'
            )}
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => setIsSignUp(!isSignUp)}
            sx={{ mt: 2 }}
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default Profile; 