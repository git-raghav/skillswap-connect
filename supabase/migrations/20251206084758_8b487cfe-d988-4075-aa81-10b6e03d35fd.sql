-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage bucket for certificates/proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for certificates
CREATE POLICY "Certificate files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates');

CREATE POLICY "Users can upload their own certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own certificates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own certificates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create user_proofs table to track uploaded certificates
CREATE TABLE public.user_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proofs are viewable by everyone" 
ON public.user_proofs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own proofs" 
ON public.user_proofs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proofs" 
ON public.user_proofs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create user_reports table
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.user_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Create skill_categories table for featured categories
CREATE TABLE public.skill_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" 
ON public.skill_categories 
FOR SELECT 
USING (true);

-- Insert default categories
INSERT INTO public.skill_categories (name, description, icon, color) VALUES
  ('Technology', 'Web development, programming, IT skills', 'Code', 'from-blue-500 to-cyan-500'),
  ('Music', 'Instruments, vocals, music theory', 'Music', 'from-purple-500 to-pink-500'),
  ('Creative', 'Art, design, crafts', 'Palette', 'from-orange-500 to-red-500'),
  ('Fitness', 'Personal training, yoga, sports', 'Dumbbell', 'from-green-500 to-emerald-500'),
  ('Languages', 'Language learning and tutoring', 'Languages', 'from-indigo-500 to-purple-500'),
  ('Business', 'Marketing, finance, consulting', 'Briefcase', 'from-gray-500 to-slate-500'),
  ('Design', 'UI/UX, graphic design, 3D modeling', 'PenTool', 'from-pink-500 to-rose-500'),
  ('Cooking', 'Culinary arts, baking, nutrition', 'ChefHat', 'from-amber-500 to-orange-500');