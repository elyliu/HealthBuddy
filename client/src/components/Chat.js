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
  SmartToy as BotIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import config from '../config';
import AddActivityDialog from './AddActivityDialog';
import ActivitiesTab from './ActivitiesTab';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activities, setActivities] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [thingsToKeepInMind, setThingsToKeepInMind] = useState('');
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const messagesEndRef = useRef(null);

  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch activities and reminders
  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

      // Fetch reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('user_reminders')
        .select('reminders')
        .eq('user_id', user.id)
        .single();

      if (remindersError) throw remindersError;
      if (remindersData) {
        setThingsToKeepInMind(remindersData.reminders);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial data fetch and welcome message
  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      if (!isMounted) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please log in to continue');
          return;
        }

        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (activitiesError) throw activitiesError;
        if (isMounted) {
          setActivities(activitiesData || []);
        }

        // Fetch reminders
        const { data: remindersData, error: remindersError } = await supabase
          .from('user_reminders')
          .select('reminders')
          .eq('user_id', user.id)
          .single();

        if (remindersError) throw remindersError;
        if (isMounted && remindersData) {
          setThingsToKeepInMind(remindersData.reminders);
        }

        // Show welcome message if not shown yet
        if (!hasShownWelcome && isMounted) {
          const requestBody = {
            message: "Hi! I'm your AI health buddy. How can I help you today?",
            userId: user.id,
            context: {
              recentActivities: activitiesData.slice(0, 5).map(activity => ({
                description: activity.description,
                date: activity.date
              })),
              thingsToKeepInMind: remindersData?.reminders || ''
            },
            systemPrompt: `Your name is Ellie.  You are a supportive, positive, and empathetic AI health buddy. Your role is to help users maintain and improve their long-term and sustainable healthy habits. Strive for consistency rather than quick fixes.
            You have access to their recent activities and personal reminders. Use this information to provide personalized, 
            relevant advice and encouragement. Keep your responses friendly, concise, and focused on health and fitness goals—avoid jargon when possible. 
            If a user's question suggests they need medical attention, advise them to consult a qualified healthcare professional.  Maybe ask questions at the end to encourage a dialogue or suggest activities to make small incremental progress toward their goals.
            If the user starts describing what they did recently, remind them to add the activities in the Activities tab.
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
            throw new Error(`Failed to get welcome message: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          if (!data.message) {
            throw new Error('Invalid response from server');
          }
          
          if (isMounted) {
            setMessages([{
              sender: 'HealthBuddy',
              content: data.message,
              timestamp: new Date()
            }]);
            setHasShownWelcome(true);
          }
        }
      } catch (error) {
        console.error('Error in initializeChat:', error);
        if (isMounted) {
          setError(`Failed to initialize chat: ${error.message}`);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
    };
  }, [hasShownWelcome]); // Only depend on hasShownWelcome

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

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
          thingsToKeepInMind: thingsToKeepInMind
        },
        systemPrompt: `Your name is Ellie.  You are a supportive, positive, and empathetic AI health buddy. Your role is to help users maintain and improve their long-term and sustainable healthy habits. Strive for consistency rather than quick fixes.
        You have access to their recent activities and personal reminders. Use this information to provide personalized, 
        relevant advice and encouragement. Keep your responses friendly, concise, and focused on health and fitness goals—avoid jargon when possible. 
        If a user's question suggests they need medical attention, advise them to consult a qualified healthcare professional.  Maybe ask questions at the end to encourage a dialogue or suggest activities to make small incremental progress toward their goals.
        If the user starts describing what they did recently, remind them to add the activities in the Activities tab.
        Things you want to encourage:
        Small, incremental changes to avoid burnout or injury. Emphasizing that consistency is key—flex goals rather than skip them.
        Encouraging any form of physical activity—not just formal workouts.
        Including strength training where feasible.
        Reducing sugar intake and increasing protein and fiber intake.`
        // systemPrompt: `You are a supportive AI health buddy. Your role is to help users maintain and improve their health and fitness. 
        // You have access to their recent activities and personal reminders. Use this information to provide personalized, 
        // relevant advice and encouragement. Keep your responses friendly, concise, and focused on health and fitness goals.`
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
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (!data.message) {
        throw new Error('Invalid response from server');
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

          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {currentTab === 0 ? 'Chat with HealthBuddy' : 'Tracked Activities'}
            </Typography>
            {currentTab === 1 && (
              <Fab
                color="error"
                aria-label="add activity"
                onClick={() => setShowAddActivity(true)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 1000,
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
            )}
          </Box>

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
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            background: message.sender === 'You' 
                              ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
                              : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                            boxShadow: message.sender === 'You'
                              ? '0 2px 10px rgba(33, 150, 243, 0.3)'
                              : '0 2px 10px rgba(76, 175, 80, 0.3)'
                          }}
                        >
                          {message.sender === 'You' ? <PersonIcon /> : <BotIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <Typography variant="caption" color="text.secondary">
                        {message.sender}
                      </Typography>
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        maxWidth: '95%',
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
    </Container>
  );
}

export default Chat; 