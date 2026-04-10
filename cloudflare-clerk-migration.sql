-- Add clerk_user_id column to users table
-- This will be the canonical auth identity from Clerk

ALTER TABLE users ADD COLUMN clerk_user_id TEXT UNIQUE;

-- Create index on clerk_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
