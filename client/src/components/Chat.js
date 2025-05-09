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
  const [historicalMessages, setHistoricalMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [goals, setGoals] = useState([]);
  const [thingsToKeepInMind, setThingsToKeepInMind] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      setIsTyping(true); // Add typing indicator for welcome message

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
    } finally {
      setIsTyping(false); // Remove typing indicator
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

  // Add useEffect to check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          // Set welcome message for non-authenticated users
          setMessages([{
            sender: 'HealthBuddy',
            content: "Hey there, welcome to VitaBuddy! 🎉\nI'm here to help you feel your best—and the more I get to know you, the better I can support you on your journey.\nTap the Profile tab to create an account or log in, and let's get started!\nCan't wait to team up with you! 💪✨"
          }]);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setUser(null);
        // Set welcome message for non-authenticated users
        setMessages([{
          sender: 'HealthBuddy',
          content: "Hey there, welcome to VitaBuddy! 🎉\nI'm here to help you feel your best—and the more I get to know you, the better I can support you on your journey.\nTap the Profile tab to create an account or log in, and let's get started!\nCan't wait to team up with you! 💪✨"
        }]);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        // Set welcome message for non-authenticated users
        setMessages([{
          sender: 'HealthBuddy',
          content: "Hey there, welcome to VitaBuddy! 🎉\nI'm here to help you feel your best—and the more I get to know you, the better I can support you on your journey.\nTap the Profile tab to create an account or log in, and let's get started!\nCan't wait to team up with you! 💪✨"
        }]);
      }
    });

    return () => subscription.unsubscribe();
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

    if (!isAuthenticated) {
      setError('Please log in to continue');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);
    setIsTyping(true);

    // Add user message to chat
    const newUserMessage = { content: userMessage, sender: 'You' };
    setMessages(prev => [...prev, newUserMessage]);

    try {
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

      console.log('Sending messages context:', contextMessages);

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
        messages: [...historicalMessages, ...contextMessages],
        systemPrompt: `You are a supportive and knowledgeable AI health coach. Your communication style is:
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

      console.log('Full request body:', requestBody);

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
      
      // Remove typing indicator before showing response
      setIsTyping(false);
      
      // Add AI response to chat
      const newAIMessage = { content: data.message, sender: 'HealthBuddy' };
      setMessages(prev => [...prev, newAIMessage]);

      // Store both user message and bot response together
      const { error: chatMessageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          user_message: userMessage,
          bot_response: data.message,
          timestamp: new Date().toISOString()
        });

      if (chatMessageError) {
        console.error('Error storing chat message:', chatMessageError);
      }

    } catch (error) {
      console.error('Error in chat:', error);
      setError('Failed to send message. Please try again.');
      setIsTyping(false);
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

  // Add function to fetch historical messages
  const fetchHistoricalMessages = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('user_message, bot_response, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching historical messages:', error);
        return;
      }

      // Transform the data into the format we need
      const transformedMessages = data.flatMap(msg => {
        const messages = [];
        if (msg.user_message) {
          messages.push({
            role: 'user',
            content: msg.user_message
          });
        }
        if (msg.bot_response) {
          messages.push({
            role: 'assistant',
            content: msg.bot_response
          });
        }
        return messages;
      });

      setHistoricalMessages(transformedMessages.reverse());
    } catch (error) {
      console.error('Error in fetchHistoricalMessages:', error);
    }
  }, [user?.id]);

  // Add effect to fetch historical messages when user changes
  useEffect(() => {
    fetchHistoricalMessages();
  }, [fetchHistoricalMessages]);

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
          scrollBehavior: 'smooth',
          maxHeight: {
            xs: 'calc(100vh - 180px)', // More space for mobile browser chrome
            sm: 'calc(100vh - 144px)'
          },
          pb: {
            xs: '100px', // More padding on mobile
            sm: '80px'
          }
        }}
      >
        <List sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          pt: {
            xs: 3, // 24px padding top on mobile
            sm: 2  // 16px padding top on desktop
          }
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
                      alt="VitaBuddy" 
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
                    alt="VitaBuddy" 
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
          height: {
            xs: '90px', // Taller on mobile
            sm: '80px'
          },
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          p: 2,
          zIndex: 1200,
          boxShadow: '0px -2px 4px rgba(0,0,0,0.05)',
          '@media (max-width: 600px)': {
            paddingBottom: 'env(safe-area-inset-bottom)' // Handle iPhone home indicator
          }
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