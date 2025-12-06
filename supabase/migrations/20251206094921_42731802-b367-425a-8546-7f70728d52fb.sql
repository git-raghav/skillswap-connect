-- Add languages column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Add proof_links column for external proof links
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS proof_links jsonb DEFAULT '[]';