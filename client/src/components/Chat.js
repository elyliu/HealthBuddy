// force a commit

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send as SendIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import config from '../config';
import AddActivityDialog from './AddActivityDialog';
import WelcomeModal from './WelcomeModal';
import { keyframes } from '@mui/system';

// Add the loading dots animation
const loadingDots = keyframes`
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
`;

function Chat({ activities, onActivityAdded, onActivityUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [goals, setGoals] = useState([]);
  const [thingsToKeepInMind, setThingsToKeepInMind] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const hasSentWelcomeRef = useRef(false);
  const hasStartedWelcomeRef = useRef(false);

  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Separate function to handle welcome message
  const sendWelcomeMessage = useCallback(async (userId, isNewUser, reminders, goals) => {
    try {
      console.log('[Welcome] Starting sendWelcomeMessage for user:', userId);

      const dayOfWeek = new Date().toLocaleDateString('en-US', { 
        weekday: 'long',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      const timeOfDay = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      const requestBody = {
        message: isNewUser 
          ? "Hi! I'm your AI health buddy. How can I help you today?"
          : "Welcome back! How can I help you today?",
        userId: userId,
        context: {
          recentActivities: activities.slice(0, 5).map(activity => ({
            description: activity.description,
            date: activity.date
          })),
          dayOfWeek: dayOfWeek,
          timeOfDay: timeOfDay
        },
        systemPrompt: `You are a supportive, positive, and energetic AI health buddy. 
        Your role is to help users maintain and improve their long-term and sustainable healthy habits. You have access to their recent activities.
        It's currently ${dayOfWeek} at ${timeOfDay}. Let's start with some brief small talk based on day of week and time of day and celebrate any recent wins to motivate them. Keep response to 2-3 sentences max.
        `
      };

      console.log('[Welcome] Sending welcome message request');
      const response = await fetch(`${config.serverUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Welcome] Welcome message request failed:', errorText);
        throw new Error(`Failed to get welcome message: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[Welcome] Welcome message response received');
      
      if (!data.message) {
        throw new Error('Invalid response from server');
      }

      // Update messages state with the welcome message
      setMessages([{
        sender: 'HealthBuddy',
        content: data.message,
        timestamp: new Date()
      }]);
      
      console.log('[Welcome] Messages updated, setting hasSentWelcomeRef to true');
      hasSentWelcomeRef.current = true;
    } catch (error) {
      console.error('[Welcome] Error sending welcome message:', error);
      setError('Failed to send welcome message. Please try again.');
    }
  }, [activities]);

  // Fetch activities and reminders
  const fetchData = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available, skipping data fetch');
        return;
      }

      console.log('Fetching data for user:', user.id);
      
      // Fetch all data in parallel
      const [remindersResponse, profileResponse, goalsResponse] = await Promise.all([
        supabase.from('user_reminders').select('reminders').eq('user_id', user.id),
        supabase.from('profiles').select('has_seen_welcome').eq('id', user.id).single(),
        supabase.from('goals').select('*').eq('user_id', user.id)
      ]);

      if (remindersResponse.error) throw remindersResponse.error;
      if (profileResponse.error) {
        console.error('Profile fetch error:', profileResponse.error);
        throw profileResponse.error;
      }
      if (goalsResponse.error) {
        console.error('Goals fetch error:', goalsResponse.error);
        throw goalsResponse.error;
      }

      console.log('Goals data:', goalsResponse.data);
      setThingsToKeepInMind(remindersResponse.data?.[0]?.reminders || '');
      setGoals(goalsResponse.data || []);

      // Check if this is a new user
      const isNewUser = profileResponse.data && !profileResponse.data.has_seen_welcome;
      
      if (isNewUser) {
        console.log('New user detected in Chat, showing welcome modal');
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    }
  }, [user?.id]);

  // Separate effect for welcome message
  useEffect(() => {
    let mounted = true;

    const sendInitialWelcomeMessage = async () => {
      console.log('[Welcome] Checking conditions for welcome message:', {
        userId: user?.id,
        messagesLength: messages.length,
        hasStartedWelcome: hasStartedWelcomeRef.current,
        hasSentWelcome: hasSentWelcomeRef.current
      });

      if (!user?.id || messages.length > 0 || hasStartedWelcomeRef.current || hasSentWelcomeRef.current) {
        console.log('[Welcome] Skipping welcome message - conditions not met:', {
          noUserId: !user?.id,
          hasMessages: messages.length > 0,
          alreadyStarted: hasStartedWelcomeRef.current,
          alreadySent: hasSentWelcomeRef.current
        });
        return;
      }

      try {
        console.log('[Welcome] Starting welcome message process for user:', user.id);
        hasStartedWelcomeRef.current = true;
        
        // Fetch user profile to check if new user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('has_seen_welcome')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('[Welcome] Profile fetch error:', profileError);
          return;
        }

        const isNewUser = profileData && !profileData.has_seen_welcome;
        console.log('[Welcome] User profile check:', { isNewUser });
        
        // Fetch reminders and goals
        const [remindersResponse, goalsResponse] = await Promise.all([
          supabase.from('user_reminders').select('reminders').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id)
        ]);

        if (remindersResponse.error || goalsResponse.error) {
          console.error('[Welcome] Error fetching data:', {
            remindersError: remindersResponse.error,
            goalsError: goalsResponse.error
          });
          return;
        }

        if (mounted && !hasSentWelcomeRef.current) {
          console.log('[Welcome] All conditions met, sending welcome message');
          await sendWelcomeMessage(
            user.id,
            isNewUser,
            remindersResponse.data?.[0]?.reminders || '',
            goalsResponse.data || []
          );
        }
      } catch (error) {
        console.error('[Welcome] Error in welcome message process:', error);
        if (mounted) {
          setError('Failed to send welcome message. Please try again.');
        }
      }
    };

    sendInitialWelcomeMessage();
  }, [user?.id]);

  // Add useEffect to set user and fetch data
  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        console.log('Checking user session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          throw error;
        }
        
        console.log('Session check result:', session ? 'Session found' : 'No session');
        if (session?.user && mounted) {
          console.log('Setting user:', session.user);
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        if (mounted) {
          setError('Failed to load user data. Please try again.');
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user);
      if (session?.user && mounted) {
        setUser(session.user);
      } else if (mounted) {
        setUser(null);
        setMessages([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleWelcomeModalClose = async () => {
    try {
      if (user?.id) {
        // Update the user's profile to mark welcome as seen
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ has_seen_welcome: true })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating welcome status:', updateError);
        }
      }
      setShowWelcomeModal(false);
    } catch (error) {
      console.error('Error handling welcome modal close:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);
    setIsTyping(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to continue');
        return;
      }

      // Add user message to chat
      setMessages(prev => [...prev, {
        sender: 'You',
        content: userMessage,
        timestamp: new Date()
      }]);

      const requestBody = {
        message: userMessage,
        userId: user.id,
        context: {
          recentActivities: activities.slice(0, 5).map(activity => ({
            description: activity.description,
            date: activity.date
          })),
          thingsToKeepInMind: thingsToKeepInMind,
          goals: goals.map(goal => ({
            description: goal.goal_text
          }))
        },
        systemPrompt: `You are a supportive, positive, and empathetic AI health buddy. Your role is to help users maintain and improve their long-term and sustainable healthy habits. Strive for consistency rather than quick fixes.
        You have access to their recent activities, personal reminders, and goals. Use this information to provide personalized, relevant advice and encouragement. 
        Keep responses to 2-3 sentences maximum unless the user asks for more. Keep your responses friendly and focused on health and fitness goals—avoid jargon when possible. 
        If a user's question suggests they need medical attention, advise them to consult a qualified healthcare professional.  Maybe ask questions at the end to encourage a dialogue or suggest activities to make small incremental progress toward their goals.
        If the user starts describing what they did recently, remind them to add the activities in the Activities tab, but don't ask them to do it every time.
        Things you want to encourage:
        Small, incremental changes to avoid burnout or injury. Emphasizing that consistency is key—flex goals rather than skip them.
        Encouraging any form of physical activity—not just formal workouts.
        Including strength training where feasible.
        Reducing sugar intake and increasing protein and fiber intake.`
      };

      console.log('Sending chat request with context:', requestBody.context);

      const response = await fetch(`${config.serverUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (!data.message) {
        throw new Error('Invalid response from server');
      }

      // Log the chat message to the database
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          user_message: userMessage,
          bot_response: data.message
        });

      if (insertError) {
        console.error('Error logging chat message:', insertError);
        // Don't throw the error, just log it - we still want to show the message to the user
      }

      setMessages(prev => [...prev, {
        sender: 'HealthBuddy',
        content: data.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add effect to log when activities change
  useEffect(() => {
    console.log('Activities updated in Chat:', activities);
  }, [activities]);

  const handleActivityAdded = async (newActivity) => {
    console.log('Activity added in Chat, calling onActivityAdded with:', newActivity);
    await onActivityAdded(newActivity);
    setShowAddActivity(false);
  };

  const handleActivityUpdate = (updatedActivities) => {
    onActivityUpdate(updatedActivities);
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        p: { xs: 2, sm: 3 },
        mt: { xs: '80px', sm: '80px' },
        height: '100%'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        {error && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.03)
        }}>
          <List>
            {messages.map((message, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  flexDirection: 'column',
                  alignItems: message.sender === 'You' ? 'flex-end' : 'flex-start',
                  mb: 0.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                  {message.sender !== 'You' && (
                    <ListItemAvatar sx={{ minWidth: 52 }}>
                      <Avatar 
                        sx={{ 
                          width: 48, 
                          height: 48,
                          background: 'none'
                        }}
                        src="/healthbuddy_logo_round.png"
                      />
                    </ListItemAvatar>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {message.sender}
                  </Typography>
                </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    maxWidth: '95%',
                    ml: message.sender === 'You' ? 0 : '52px',
                    background: message.sender === 'You' 
                      ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    color: message.sender === 'You' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    boxShadow: message.sender === 'You'
                      ? '0 4px 20px rgba(33, 150, 243, 0.2)'
                      : '0 4px 20px rgba(0, 0, 0, 0.05)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography variant="body1">
                    {message.content}
                  </Typography>
                </Paper>
              </ListItem>
            ))}

            {isTyping && (
              <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                  <ListItemAvatar sx={{ minWidth: 52 }}>
                    <Avatar 
                      sx={{ 
                        width: 48, 
                        height: 48,
                        background: 'none'
                      }}
                      src="/healthbuddy_logo_round.png"
                    />
                  </ListItemAvatar>
                  <Typography variant="caption" color="text.secondary">
                    HealthBuddy
                  </Typography>
                </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    maxWidth: '95%',
                    ml: '52px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    minWidth: '100px'
                  }}
                >
                  <Typography variant="body1">
                    <Box
                      component="span"
                      sx={{
                        '&::after': {
                          content: '""',
                          animation: `${loadingDots} 1.5s infinite`,
                          display: 'inline-block',
                          width: '1em',
                          textAlign: 'left'
                        }
                      }}
                    >
                      Typing
                    </Box>
                  </Typography>
                </Paper>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />
            <IconButton 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{
                alignSelf: 'flex-end',
                background: theme.palette.primary.main,
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': {
                  background: theme.palette.primary.dark
                },
                '&.Mui-disabled': {
                  background: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>

        <AddActivityDialog
          open={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onActivityAdded={handleActivityAdded}
        />

        <WelcomeModal
          open={showWelcomeModal}
          onClose={handleWelcomeModalClose}
        />
      </Box>
    </Container>
  );
}

export default Chat; 