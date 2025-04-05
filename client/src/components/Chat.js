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
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest('[role="presentation"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
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

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading]);

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
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // Add user message to chat
    const newUserMessage = { content: userMessage, sender: 'You' };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      if (!user?.id) {
        throw new Error('Please log in to continue');
      }

      // Add user message to messages array first
      const newMessages = [...messages, newUserMessage];
      setMessages(newMessages);

      // Prepare context from all messages including the current one
      const contextMessages = newMessages
        .filter(msg => !msg.content.includes("Hello! I'm your AI health coach"))
        .map(msg => ({
          role: msg.sender === 'You' ? 'user' : 'assistant',
          content: msg.content
        }));

      console.log('Sending messages context:', contextMessages); // Add logging

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
        messages: contextMessages,
        systemPrompt: `You are HealthBuddy, a supportive and knowledgeable AI health coach. Your communication style is:
          - Friendly and encouraging, but professional
          - Focused on sustainable, long-term health habits
          - Personalized to the user's goals and preferences
          - Evidence-based while remaining accessible
          - ALWAYS keep responses to 2-3 sentences maximum
          - ALWAYS reference previous messages in the conversation when relevant
          
          User Context:
          ${goals.length > 0 ? `Goals:\n${goals.map(g => `- ${g.goal_text}`).join('\n')}` : 'No goals set yet'}
          ${thingsToKeepInMind ? `\nThings to keep in mind:\n${thingsToKeepInMind}` : ''}
          ${activities.length > 0 ? `\nRecent activities:\n${activities.slice(0, 5).map(a => `- ${a.description} (${new Date(a.date).toLocaleDateString()})`).join('\n')}` : 'No recent activities'}
          
          Use this information to provide relevant, personalized guidance. Reference specific goals and activities when appropriate to make responses more personal and contextual. Remember to ALWAYS keep responses to 2-3 sentences maximum and maintain conversation context by referencing previous messages when relevant.`
      };

      console.log('Full request body:', requestBody); // Add logging

      const response = await fetch(`${config.serverUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add AI response to chat
      const newAIMessage = { content: data.message, sender: 'HealthBuddy' };
      setMessages(prev => [...prev, newAIMessage]);

    } catch (error) {
      console.error('Error in chat:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
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

  // Add effect to scroll when messages change
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Add effect to scroll when loading changes
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  return (
    <Container maxWidth="md" sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 64, // Height of navbar
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {error && (
        <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Messages Container */}
      <Box 
        role="presentation"
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 144px)' // Viewport height minus navbar and input box
        }}
      >
        <List sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          pb: '16px'
        }}>
          {messages.map((message, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                flexDirection: 'column',
                alignItems: message.sender === 'You' ? 'flex-end' : 'flex-start',
                mb: 2,
                width: '100%',
                px: 2
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                maxWidth: '80%'
              }}>
                {message.sender !== 'You' && (
                  <ListItemAvatar>
                    <Avatar 
                      alt="HealthBuddy" 
                      src="/healthbuddy_logo_round.png"
                      sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
                    />
                  </ListItemAvatar>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: message.sender === 'You' ? 'primary.main' : 'background.paper',
                    color: message.sender === 'You' ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                    maxWidth: '100%',
                    wordBreak: 'break-word'
                  }}
                >
                  <Typography variant="body1">
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          ))}

          {isTyping && (
            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                maxWidth: '80%'
              }}>
                <ListItemAvatar>
                  <Avatar 
                    alt="HealthBuddy" 
                    src="/healthbuddy_logo_round.png"
                    sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
                  />
                </ListItemAvatar>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    position: 'relative'
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{
                      '&::after': {
                        content: '""',
                        animation: `${loadingDots} 1s infinite`,
                      }
                    }}
                  >
                    Typing
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Input Box Container */}
      <Box 
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          p: 2,
          zIndex: 1200,
          boxShadow: '0px -2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <Container maxWidth="md" sx={{ 
          height: '100%',
          mx: 'auto'
        }}>
          <Box sx={{ 
            display: 'flex',
            gap: 1,
            width: '100%',
            alignItems: 'center'
          }}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'background.paper'
                }
              }}
            />
            <IconButton 
              type="submit"
              color="primary" 
              disabled={loading || !input.trim()}
              sx={{
                ml: 1,
                width: '50px',
                height: '50px',
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
        </Container>
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
    </Container>
  );
}

export default Chat; 