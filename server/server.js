require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.68.56:3000'],
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthbuddy')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Add new endpoint to save user reminders
app.post('/api/reminders', async (req, res) => {
  try {
    const { userId, reminders } = req.body;
    
    const { data, error } = await supabase
      .from('user_reminders')
      .upsert({
        user_id: userId,
        reminders: reminders
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error saving reminders:', error);
    res.status(500).json({ error: 'Failed to save reminders' });
  }
});

// Add new endpoint to get user reminders
app.get('/api/reminders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('user_reminders')
      .select('reminders')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId, context } = req.body;
    
    // Format the context for the AI
    let formattedContext = '';
    
    if (context.recentActivities && context.recentActivities.length > 0) {
      formattedContext += 'Recent activities:\n';
      context.recentActivities.forEach(activity => {
        formattedContext += `• ${activity.description} (${new Date(activity.date).toLocaleDateString()})\n`;
      });
      formattedContext += '\n';
    }
    
    if (context.thingsToKeepInMind) {
      formattedContext += 'Things to keep in mind:\n';
      formattedContext += context.thingsToKeepInMind + '\n\n';
    }

    console.log('Sending request to OpenAI...');
    const messages = [
      { role: 'system', content: 'You are a helpful health and fitness assistant. Keep the user\'s context in mind when providing advice.' },
      { role: 'system', content: formattedContext },
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    console.log('Received response from OpenAI:', response);
    res.json({ message: response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
});

// Helper function to generate welcome message
function generateWelcomeMessage(userName, goals) {
  const timeOfDay = new Date().getHours();
  let greeting = '';
  
  if (timeOfDay < 12) greeting = 'Good morning';
  else if (timeOfDay < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  const nameGreeting = userName ? `${greeting}, ${userName}! 👋` : `${greeting}! 👋`;
  
  let goalsSection = '';
  if (goals) {
    goalsSection = `\n\nI see you're working on these goals:\n${goals}\n\nI'll help you stay on track with these goals and provide personalized guidance!`;
  }

  return `${nameGreeting} I'm your HealthBuddy AI coach, and I'm here to help you achieve your fitness and wellness goals!${goalsSection}\n\nI can help you with:\n• Tracking your fitness progress\n• Providing workout recommendations\n• Offering nutrition advice\n• Answering health-related questions\n• Setting and adjusting your goals\n\nWhat would you like help with today? 💪`;
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Server is accepting connections from all network interfaces');
}); 