-- Add has_seen_welcome column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'has_seen_welcome'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN has_seen_welcome BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing profiles to have seen the welcome modal
UPDATE profiles
SET has_seen_welcome = TRUE
WHERE has_seen_welcome IS NULL; 