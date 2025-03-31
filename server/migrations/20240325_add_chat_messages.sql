-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own messages
CREATE POLICY "Users can insert their own chat messages"
    ON chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own messages
CREATE POLICY "Users can view their own chat messages"
    ON chat_messages FOR SELECT
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX chat_messages_timestamp_idx ON chat_messages(timestamp); 