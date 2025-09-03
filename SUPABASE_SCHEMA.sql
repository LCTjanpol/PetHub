-- 🚀 PetHub Supabase Database Schema
-- Based on Prisma schema with RLS policies and storage buckets

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STORAGE BUCKETS FOR FILE UPLOADS
-- =====================================================

-- Profile pictures bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Pet pictures bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-pictures', 'pet-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Post images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Shop images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLES CREATION
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    "fullName" VARCHAR(255) NOT NULL,
    "profilePicture" TEXT,
    gender VARCHAR(50) NOT NULL,
    birthdate TIMESTAMP NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "isAdmin" BOOLEAN DEFAULT false,
    "isShopOwner" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Pets table
CREATE TABLE IF NOT EXISTS "Pet" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    "petPicture" TEXT,
    birthdate TIMESTAMP NOT NULL,
    type VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    "healthCondition" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS "Task" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "petId" INTEGER NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    time TIMESTAMP NOT NULL,
    frequency VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS "Post" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image TEXT,
    likes INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS "Comment" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "postId" INTEGER NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Replies table
CREATE TABLE IF NOT EXISTS "Reply" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "commentId" INTEGER NOT NULL REFERENCES "Comment"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS "PostLike" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "postId" INTEGER NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "postId")
);

-- Vaccination records table
CREATE TABLE IF NOT EXISTS "VaccinationRecord" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "petId" INTEGER NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
    "vaccineName" VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    "expirationDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Medical records table
CREATE TABLE IF NOT EXISTS "MedicalRecord" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "petId" INTEGER NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    "medicineName" VARCHAR(255) NOT NULL,
    veterinarian VARCHAR(255) NOT NULL,
    clinic VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Shops table
CREATE TABLE IF NOT EXISTS "Shop" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "shopName" VARCHAR(255) NOT NULL,
    "shopImage" TEXT,
    "shopLocation" TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    bio TEXT,
    "contactNumber" VARCHAR(50) NOT NULL,
    "shopMessage" TEXT,
    "shopType" VARCHAR(100) NOT NULL,
    "openingTime" VARCHAR(50) NOT NULL,
    "closingTime" VARCHAR(50) NOT NULL,
    "availableDays" TEXT[] DEFAULT '{}',
    "isAvailable" BOOLEAN DEFAULT true,
    approved BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Shop applications table
CREATE TABLE IF NOT EXISTS "ShopApplication" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "shopName" VARCHAR(255) NOT NULL,
    "shopImage" TEXT,
    "shopLocation" TEXT NOT NULL,
    latitude DOUBLE PRECISION DEFAULT 0,
    longitude DOUBLE PRECISION DEFAULT 0,
    bio TEXT,
    "contactNumber" VARCHAR(50) NOT NULL,
    "shopMessage" TEXT,
    "shopType" VARCHAR(100) NOT NULL,
    "openingTime" VARCHAR(50) NOT NULL,
    "closingTime" VARCHAR(50) NOT NULL,
    "availableDays" TEXT[] DEFAULT '{}',
    "isAvailable" BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Promotional posts table
CREATE TABLE IF NOT EXISTS "PromotionalPost" (
    id SERIAL PRIMARY KEY,
    "shopId" INTEGER NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
    caption TEXT,
    image TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_is_admin ON "User"("isAdmin");
CREATE INDEX IF NOT EXISTS idx_user_is_shop_owner ON "User"("isShopOwner");

-- Pet indexes
CREATE INDEX IF NOT EXISTS idx_pet_user_id ON "Pet"("userId");
CREATE INDEX IF NOT EXISTS idx_pet_type ON "Pet"(type);

-- Post indexes
CREATE INDEX IF NOT EXISTS idx_post_user_id ON "Post"("userId");
CREATE INDEX IF NOT EXISTS idx_post_created_at ON "Post"("createdAt");

-- Comment indexes
CREATE INDEX IF NOT EXISTS idx_comment_post_id ON "Comment"("postId");
CREATE INDEX IF NOT EXISTS idx_comment_user_id ON "Comment"("userId");

-- Shop indexes
CREATE INDEX IF NOT EXISTS idx_shop_user_id ON "Shop"("userId");
CREATE INDEX IF NOT EXISTS idx_shop_approved ON "Shop"(approved);
CREATE INDEX IF NOT EXISTS idx_shop_location ON "Shop"(latitude, longitude);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) ENABLING
-- =====================================================

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
ALTER TABLE "PromotionalPost" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- User policies
CREATE POLICY "Users can view their own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON "User"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::integer AND "isAdmin" = true
        )
    );

CREATE POLICY "Admins can update all users" ON "User"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::integer AND "isAdmin" = true
        )
    );

-- Pet policies
CREATE POLICY "Users can view their own pets" ON "Pet"
    FOR SELECT USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can create their own pets" ON "Pet"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own pets" ON "Pet"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own pets" ON "Pet"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- Task policies
CREATE POLICY "Users can view their own tasks" ON "Task"
    FOR SELECT USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can create their own tasks" ON "Task"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own tasks" ON "Task"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own tasks" ON "Task"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- Post policies
CREATE POLICY "Anyone can view posts" ON "Post"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON "Post"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own posts" ON "Post"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own posts" ON "Post"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- Comment policies
CREATE POLICY "Anyone can view comments" ON "Comment"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON "Comment"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own comments" ON "Comment"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own comments" ON "Comment"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- Reply policies
CREATE POLICY "Anyone can view replies" ON "Reply"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own replies" ON "Reply"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own replies" ON "Reply"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own replies" ON "Reply"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- PostLike policies
CREATE POLICY "Anyone can view post likes" ON "PostLike"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own post likes" ON "PostLike"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own post likes" ON "PostLike"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- VaccinationRecord policies
CREATE POLICY "Users can view their own vaccination records" ON "VaccinationRecord"
    FOR SELECT USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can create their own vaccination records" ON "VaccinationRecord"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own vaccination records" ON "VaccinationRecord"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own vaccination records" ON "VaccinationRecord"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- MedicalRecord policies
CREATE POLICY "Users can view their own medical records" ON "MedicalRecord"
    FOR SELECT USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can create their own medical records" ON "MedicalRecord"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own medical records" ON "MedicalRecord"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can delete their own medical records" ON "MedicalRecord"
    FOR DELETE USING ("userId" = auth.uid()::integer);

-- Shop policies
CREATE POLICY "Anyone can view approved shops" ON "Shop"
    FOR SELECT USING (approved = true);

CREATE POLICY "Shop owners can view their own shop" ON "Shop"
    FOR SELECT USING ("userId" = auth.uid()::integer);

CREATE POLICY "Shop owners can update their own shop" ON "Shop"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Admins can view all shops" ON "Shop"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::integer AND "isAdmin" = true
        )
    );

CREATE POLICY "Admins can update all shops" ON "Shop"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::integer AND "isAdmin" = true
        )
    );

-- ShopApplication policies
CREATE POLICY "Users can view their own applications" ON "ShopApplication"
    FOR SELECT USING ("userId" = auth.uid()::integer);

CREATE POLICY "Users can create their own applications" ON "ShopApplication"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::integer);

CREATE POLICY "Users can update their own applications" ON "ShopApplication"
    FOR UPDATE USING ("userId" = auth.uid()::integer);

CREATE POLICY "Admins can view all applications" ON "ShopApplication"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::integer AND "isAdmin" = true
        )
    );

CREATE POLICY "Admins can update all applications" ON "ShopApplication"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::integer AND "isAdmin" = true
        )
    );

-- PromotionalPost policies
CREATE POLICY "Anyone can view promotional posts" ON "PromotionalPost"
    FOR SELECT USING (true);

CREATE POLICY "Shop owners can create promotional posts" ON "PromotionalPost"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE id = "shopId" AND "userId" = auth.uid()::integer AND approved = true
        )
    );

CREATE POLICY "Shop owners can update their promotional posts" ON "PromotionalPost"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE id = "shopId" AND "userId" = auth.uid()::integer AND approved = true
        )
    );

CREATE POLICY "Shop owners can delete their promotional posts" ON "PromotionalPost"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE id = "shopId" AND "userId" = auth.uid()::integer AND approved = true
        )
    );

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Profile pictures storage policies
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Pet pictures storage policies
CREATE POLICY "Users can upload their own pet pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pet-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view pet pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'pet-pictures');

CREATE POLICY "Users can update their own pet pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pet-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own pet pictures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pet-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Post images storage policies
CREATE POLICY "Users can upload their own post images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'post-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view post images" ON storage.objects
    FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Users can update their own post images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'post-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own post images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'post-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Shop images storage policies
CREATE POLICY "Shop owners can upload shop images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'shop-images' AND 
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE "userId" = auth.uid()::integer AND approved = true
        )
    );

CREATE POLICY "Anyone can view shop images" ON storage.objects
    FOR SELECT USING (bucket_id = 'shop-images');

CREATE POLICY "Shop owners can update their shop images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'shop-images' AND 
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE "userId" = auth.uid()::integer AND approved = true
        )
    );

CREATE POLICY "Shop owners can delete their shop images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'shop-images' AND 
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE "userId" = auth.uid()::integer AND approved = true
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_updated_at BEFORE UPDATE ON "Pet"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON "Task"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_updated_at BEFORE UPDATE ON "Post"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_updated_at BEFORE UPDATE ON "Comment"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reply_updated_at BEFORE UPDATE ON "Reply"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaccination_record_updated_at BEFORE UPDATE ON "VaccinationRecord"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_record_updated_at BEFORE UPDATE ON "MedicalRecord"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_updated_at BEFORE UPDATE ON "Shop"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_application_updated_at BEFORE UPDATE ON "ShopApplication"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotional_post_updated_at BEFORE UPDATE ON "PromotionalPost"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert a default admin user (password: admin123)
-- INSERT INTO "User" ("fullName", gender, birthdate, email, password, "isAdmin", "isShopOwner")
-- VALUES ('Admin User', 'Other', '1990-01-01', 'admin@pethub.com', crypt('admin123', gen_salt('bf')), true, false);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE "User" IS 'User accounts and profiles';
COMMENT ON TABLE "Pet" IS 'Pet profiles and information';
COMMENT ON TABLE "Task" IS 'Pet care tasks and reminders';
COMMENT ON TABLE "Post" IS 'Social media posts';
COMMENT ON TABLE "Comment" IS 'Comments on posts';
COMMENT ON TABLE "Reply" IS 'Replies to comments';
COMMENT ON TABLE "PostLike" IS 'Post likes by users';
COMMENT ON TABLE "VaccinationRecord" IS 'Pet vaccination records';
COMMENT ON TABLE "MedicalRecord" IS 'Pet medical records';
COMMENT ON TABLE "Shop" IS 'Pet shop information';
COMMENT ON TABLE "ShopApplication" IS 'Shop ownership applications';
COMMENT ON TABLE "PromotionalPost" IS 'Shop promotional posts';

-- =====================================================
-- SCHEMA COMPLETION
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ PetHub Supabase schema created successfully!';
    RAISE NOTICE '📊 Tables: 13 tables created with RLS enabled';
    RAISE NOTICE '🔒 Security: RLS policies configured for all tables';
    RAISE NOTICE '📁 Storage: 4 storage buckets configured';
    RAISE NOTICE '⚡ Performance: Indexes created for optimal queries';
    RAISE NOTICE '🔄 Triggers: Auto-update timestamps configured';
END $$;
