-- PetHub Supabase Schema Deployment
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('user-images', 'user-images', true),
  ('pet-images', 'pet-images', true),
  ('shop-images', 'shop-images', true),
  ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for user-images bucket
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-images');

CREATE POLICY "Users can update their own images" ON storage.objects  
FOR UPDATE USING (bucket_id = 'user-images');

CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (bucket_id = 'user-images');

CREATE POLICY "Anyone can view user images" ON storage.objects
FOR SELECT USING (bucket_id = 'user-images');

-- RLS Policies for pet-images bucket
CREATE POLICY "Users can upload pet images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pet-images');

CREATE POLICY "Users can update pet images" ON storage.objects
FOR UPDATE USING (bucket_id = 'pet-images');

CREATE POLICY "Users can delete pet images" ON storage.objects
FOR DELETE USING (bucket_id = 'pet-images');

CREATE POLICY "Anyone can view pet images" ON storage.objects
FOR SELECT USING (bucket_id = 'pet-images');

-- RLS Policies for shop-images bucket
CREATE POLICY "Shop owners can upload shop images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "Shop owners can update shop images" ON storage.objects
FOR UPDATE USING (bucket_id = 'shop-images');

CREATE POLICY "Shop owners can delete shop images" ON storage.objects
FOR DELETE USING (bucket_id = 'shop-images');

CREATE POLICY "Anyone can view shop images" ON storage.objects
FOR SELECT USING (bucket_id = 'shop-images');

-- RLS Policies for post-images bucket
CREATE POLICY "Users can upload post images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Users can update post images" ON storage.objects
FOR UPDATE USING (bucket_id = 'post-images');

CREATE POLICY "Users can delete post images" ON storage.objects
FOR DELETE USING (bucket_id = 'post-images');

CREATE POLICY "Anyone can view post images" ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
