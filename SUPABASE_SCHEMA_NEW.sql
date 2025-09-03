-- PetHub Supabase Database Schema (Fresh Setup)
-- Created: 2024-12-30
-- Database: New PetHub Project

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-pictures', 'profile-pictures', true),
  ('pet-pictures', 'pet-pictures', true),
  ('post-images', 'post-images', true),
  ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create tables in correct order (no circular dependencies)
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  fullName TEXT NOT NULL,
  gender TEXT NOT NULL,
  birthdate DATE NOT NULL,
  profileImage TEXT,
  isAdmin BOOLEAN DEFAULT false,
  isShopOwner BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Pet" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  birthdate DATE,
  gender TEXT NOT NULL,
  petImage TEXT,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Shop" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  contact TEXT,
  operatingHours TEXT,
  availableDays TEXT,
  shopImage TEXT,
  ownerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Post" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  image TEXT,
  userId UUID REFERENCES "User"(id) ON DELETE CASCADE,
  shopId UUID REFERENCES "Shop"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Task" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  dueDate TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  petId UUID NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Comment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  postId UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Reply" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  commentId UUID NOT NULL REFERENCES "Comment"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PostLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(postId, userId)
);

CREATE TABLE IF NOT EXISTS "VaccinationRecord" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccineName TEXT NOT NULL,
  dateGiven DATE NOT NULL,
  nextDueDate DATE,
  notes TEXT,
  petId UUID NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "MedicalRecord" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition TEXT NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  date DATE NOT NULL,
  notes TEXT,
  petId UUID NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ShopApplication" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopName TEXT NOT NULL,
  description TEXT,
  address TEXT,
  contact TEXT,
  operatingHours TEXT,
  availableDays TEXT,
  status TEXT DEFAULT 'pending',
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pet_userid ON "Pet"(userId);
CREATE INDEX IF NOT EXISTS idx_task_petid ON "Task"(petId);
CREATE INDEX IF NOT EXISTS idx_task_userid ON "Task"(userId);
CREATE INDEX IF NOT EXISTS idx_post_userid ON "Post"(userId);
CREATE INDEX IF NOT EXISTS idx_post_shopid ON "Post"(shopId);
CREATE INDEX IF NOT EXISTS idx_comment_postid ON "Comment"(postId);
CREATE INDEX IF NOT EXISTS idx_reply_commentid ON "Reply"(commentId);
CREATE INDEX IF NOT EXISTS idx_postlike_postid ON "PostLike"(postId);
CREATE INDEX IF NOT EXISTS idx_vaccination_petid ON "VaccinationRecord"(petId);
CREATE INDEX IF NOT EXISTS idx_medical_petid ON "MedicalRecord"(petId);
CREATE INDEX IF NOT EXISTS idx_shop_ownerid ON "Shop"(ownerId);

-- Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostLike" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VaccinationRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopApplication" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User table
CREATE POLICY "Users can view their own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- RLS Policies for Pet table
CREATE POLICY "Users can view their own pets" ON "Pet"
  FOR SELECT USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their own pets" ON "Pet"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can insert their own pets" ON "Pet"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their own pets" ON "Pet"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for Shop table
CREATE POLICY "Anyone can view shops" ON "Shop"
  FOR SELECT USING (true);

CREATE POLICY "Shop owners can update their shops" ON "Shop"
  FOR UPDATE USING (auth.uid()::text = ownerId::text);

CREATE POLICY "Shop owners can insert their shops" ON "Shop"
  FOR INSERT WITH CHECK (auth.uid()::text = ownerId::text);

CREATE POLICY "Shop owners can delete their shops" ON "Shop"
  FOR DELETE USING (auth.uid()::text = ownerId::text);

-- RLS Policies for Post table
CREATE POLICY "Anyone can view posts" ON "Post"
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON "Post"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their own posts" ON "Post"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their own posts" ON "Post"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for Task table
CREATE POLICY "Users can view their own tasks" ON "Task"
  FOR SELECT USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their own tasks" ON "Task"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can insert their own tasks" ON "Task"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their own tasks" ON "Task"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for Comment table
CREATE POLICY "Anyone can view comments" ON "Comment"
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON "Comment"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their own comments" ON "Comment"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their own comments" ON "Comment"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for Reply table
CREATE POLICY "Anyone can view replies" ON "Reply"
  FOR SELECT USING (true);

CREATE POLICY "Users can create replies" ON "Reply"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their own replies" ON "Reply"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their own replies" ON "Reply"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for PostLike table
CREATE POLICY "Anyone can view likes" ON "PostLike"
  FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON "PostLike"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their own likes" ON "PostLike"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for VaccinationRecord table
CREATE POLICY "Users can view their pet vaccinations" ON "VaccinationRecord"
  FOR SELECT USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their pet vaccinations" ON "VaccinationRecord"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can insert their pet vaccinations" ON "VaccinationRecord"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their pet vaccinations" ON "VaccinationRecord"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for MedicalRecord table
CREATE POLICY "Users can view their pet medical records" ON "MedicalRecord"
  FOR SELECT USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their pet medical records" ON "MedicalRecord"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can insert their pet medical records" ON "MedicalRecord"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their pet medical records" ON "MedicalRecord"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- RLS Policies for ShopApplication table
CREATE POLICY "Users can view their own applications" ON "ShopApplication"
  FOR SELECT USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can update their own applications" ON "ShopApplication"
  FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can insert their own applications" ON "ShopApplication"
  FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete their own applications" ON "ShopApplication"
  FOR DELETE USING (auth.uid()::text = userId::text);

-- Storage bucket policies
CREATE POLICY "Users can upload profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload pet pictures" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pet-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view pet pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'pet-pictures');

CREATE POLICY "Users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view post images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Shop owners can upload shop images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view shop images" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-images');

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pet_updated_at BEFORE UPDATE ON "Pet" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_updated_at BEFORE UPDATE ON "Shop" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_updated_at BEFORE UPDATE ON "Post" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON "Task" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comment_updated_at BEFORE UPDATE ON "Comment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reply_updated_at BEFORE UPDATE ON "Reply" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_postlike_updated_at BEFORE UPDATE ON "PostLike" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaccination_updated_at BEFORE UPDATE ON "VaccinationRecord" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_updated_at BEFORE UPDATE ON "MedicalRecord" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopapplication_updated_at BEFORE UPDATE ON "ShopApplication" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add table comments
COMMENT ON TABLE "User" IS 'User accounts and profiles';
COMMENT ON TABLE "Pet" IS 'Pet information and profiles';
COMMENT ON TABLE "Shop" IS 'Pet shop information';
COMMENT ON TABLE "Post" IS 'User and shop posts';
COMMENT ON TABLE "Task" IS 'Pet care tasks and reminders';
COMMENT ON TABLE "Comment" IS 'Comments on posts';
COMMENT ON TABLE "Reply" IS 'Replies to comments';
COMMENT ON TABLE "PostLike" IS 'Post likes by users';
COMMENT ON TABLE "VaccinationRecord" IS 'Pet vaccination records';
COMMENT ON TABLE "MedicalRecord" IS 'Pet medical records';
COMMENT ON TABLE "ShopApplication" IS 'Shop owner applications';

-- Success message
SELECT 'PetHub Supabase database schema created successfully!' as status;
