-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pending_signups table
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- Ensure the existing policies work with RLS enabled
-- No need to recreate policies; they already exist
