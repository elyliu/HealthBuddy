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
  Fab,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import config from '../config';
import AddActivityDialog from './AddActivityDialog';
import ActivitiesTab from './ActivitiesTab';
import WelcomeModal from './WelcomeModal';
import { keyframes } from '@mui/system';

// Add the loading dots animation
const loadingDots = keyframes`
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
`;

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [thingsToKeepInMind, setThingsToKeepInMind] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch activities and reminders
  const fetchData = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available, skipping data fetch');
        return;
      }

      // Skip welcome message if we already have messages
      if (messages.length > 0) {
        console.log('Messages already exist, skipping welcome message');
        // Still fetch the data but don't show welcome message
        const [activitiesResponse, remindersResponse, goalsResponse] = await Promise.all([
          supabase.from('activities').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('user_reminders').select('reminders').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id)
        ]);

        if (activitiesResponse.error) throw activitiesResponse.error;
        if (remindersResponse.error) throw remindersResponse.error;
        if (goalsResponse.error) throw goalsResponse.error;

        setActivities(activitiesResponse.data || []);
        setThingsToKeepInMind(remindersResponse.data?.[0]?.reminders || '');
        setGoals(goalsResponse.data || []);
        return;
      }

      console.log('Fetching data for user:', user.id);
      
      // Fetch all data in parallel
      const [activitiesResponse, remindersResponse, profileResponse, goalsResponse] = await Promise.all([
        supabase.from('activities').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('user_reminders').select('reminders').eq('user_id', user.id),
        supabase.from('profiles').select('has_seen_welcome').eq('id', user.id).single(),
        supabase.from('goals').select('*').eq('user_id', user.id)
      ]);

      if (activitiesResponse.error) throw activitiesResponse.error;
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

      setActivities(activitiesResponse.data || []);
      setThingsToKeepInMind(remindersResponse.data?.[0]?.reminders || '');
      setGoals(goalsResponse.data || []);

      // Log the goals state after setting it
      console.log('Goals state after setting:', goalsResponse.data || []);

      // Check if this is a new user who hasn't seen the welcome message
      if (profileResponse.data && !profileResponse.data.has_seen_welcome) {
        console.log('New user detected in Chat, showing welcome modal and message');
        setShowWelcomeModal(true);
        
        // Only add welcome message if there are no messages yet
        if (messages.length === 0) {
          // Add initial welcome message
          const requestBody = {
            message: "Hi! I'm your AI health buddy. How can I help you today?",
            userId: user.id,
            context: {
              recentActivities: (activitiesResponse.data || []).slice(0, 5).map(activity => ({
                description: activity.description,
                date: activity.date
              })),
              thingsToKeepInMind: remindersResponse.data?.[0]?.reminders || '',
              goals: goalsResponse.data.map(goal => ({
                description: goal.goal_text
              }))
            },
            systemPrompt: `Your name is Ellie.  You are a supportive, positive, and empathetic AI health buddy. Your role is to help users maintain and improve their long-term and sustainable healthy habits. Strive for consistency rather than quick fixes.
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

          console.log('Sending initial welcome message request');
          const response = await fetch(`${config.serverUrl}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Welcome message request failed:', errorText);
            throw new Error(`Failed to get welcome message: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log('Welcome message response:', data);
          
          if (!data.message) {
            throw new Error('Invalid response from server');
          }

          // Update messages state with the welcome message
          setMessages([{
            sender: 'HealthBuddy',
            content: data.message,
            timestamp: new Date()
          }]);
        }
      } else if (messages.length === 0) {
        // Add welcome back message for existing users
        const requestBody = {
          message: "Welcome back! How can I help you today?",
          userId: user.id,
          context: {
            recentActivities: (activitiesResponse.data || []).slice(0, 5).map(activity => ({
              description: activity.description,
              date: activity.date
            })),
            thingsToKeepInMind: remindersResponse.data?.[0]?.reminders || '',
            goals: goalsResponse.data.map(goal => ({
              description: goal.goal_text
            }))
          },
          systemPrompt: `Your name is Ellie.  You are a supportive, positive, and empathetic AI health buddy. Your role is to help users maintain and improve their long-term and sustainable healthy habits. Strive for consistency rather than quick fixes.
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

        const response = await fetch(`${config.serverUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Welcome back message request failed:', errorText);
          throw new Error(`Failed to get welcome back message: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        if (!data.message) {
          throw new Error('Invalid response from server');
        }

        setMessages([{
          sender: 'HealthBuddy',
          content: data.message,
          timestamp: new Date()
        }]);
      } else {
        console.log('User has already seen welcome message or no profile data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    }
  }, [user?.id, messages.length]);

  // Separate data fetching from welcome message handling
  const initializeUserData = useCallback(async () => {
    if (!user?.id) return;
    await fetchData();
  }, [user?.id, fetchData]);

  // Add useEffect to set user and fetch data
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('Checking user session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          throw error;
        }
        
        console.log('Session check result:', session ? 'Session found' : 'No session');
        if (session?.user) {
          console.log('Setting user:', session.user);
          setUser(session.user);
          await initializeUserData();
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setError('Failed to load user data. Please try again.');
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user);
      if (session?.user) {
        console.log('Setting user from auth change:', session.user);
        setUser(session.user);
        // Only fetch data on sign_in event to prevent duplicate welcome messages
        if (event === 'SIGNED_IN') {
          await initializeUserData();
        }
      } else {
        setUser(null);
        setMessages([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeUserData]);

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
        systemPrompt: `Your name is Ellie.  You are a supportive, positive, and empathetic AI health buddy. Your role is to help users maintain and improve their long-term and sustainable healthy habits. Strive for consistency rather than quick fixes.
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

      console.log('Raw goals from state:', goals);
      console.log('Mapped goals in request:', requestBody.context.goals);

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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="md" sx={{ height: 'calc(100vh - 180px)', py: 1 }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper 
          elevation={0}
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              sx={{ 
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }
              }}
            >
              <Tab label="Chat" />
              <Tab label="Activities" />
            </Tabs>
          </Box>

          {currentTab === 1 && (
            <Box sx={{ position: 'absolute', top: 8, right: 16, zIndex: 1000 }}>
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
          )}

          {error && (
            <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {currentTab === 0 ? (
            <>
              <List 
                sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: 2,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: alpha(theme.palette.primary.main, 0.3),
                    borderRadius: '4px',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.5),
                    },
                  },
                }}
              >
                {messages.map((message, index) => (
                  <ListItem 
                    key={index} 
                    sx={{ 
                      flexDirection: 'column',
                      alignItems: message.sender === 'You' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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
                        p: 2,
                        maxWidth: '95%',
                        ml: message.sender === 'You' ? 0 : '52px', // Add margin to align with avatar
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
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 1,
                          opacity: 0.7,
                          textAlign: 'right'
                        }}
                      >
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
                {isTyping && (
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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
                        p: 2,
                        maxWidth: '95%',
                        ml: '52px', // Add margin to align with avatar
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

              <Box 
                sx={{ 
                  p: 2, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  position: 'sticky',
                  bottom: 0
                }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        },
                      },
                    }}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleSend} 
                    disabled={!input.trim() || loading}
                    sx={{
                      alignSelf: 'flex-end',
                      mb: 0.5,
                      background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                      color: 'white',
                      boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                        boxShadow: '0 6px 25px rgba(33, 150, 243, 0.4)'
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <ActivitiesTab activities={activities} />
          )}
        </Paper>
      </Box>

      <AddActivityDialog 
        open={showAddActivity} 
        onClose={() => {
          setShowAddActivity(false);
          fetchData();
        }} 
      />

      <WelcomeModal
        open={showWelcomeModal}
        onClose={handleWelcomeModalClose}
      />
    </Container>
  );
}

export default Chat; 