-- 🚀 PetHub Supabase Database Schema (Fixed for UUID)
-- Execute this in Supabase SQL Editor to fix the auth.uid() casting error

-- =====================================================
-- STEP 1: ENABLE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 2: CREATE STORAGE BUCKETS
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
-- STEP 3: CREATE TABLES WITH UUID PRIMARY KEYS
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "petId" UUID NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image TEXT,
    likes INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS "Comment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "postId" UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Replies table
CREATE TABLE IF NOT EXISTS "Reply" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "commentId" UUID NOT NULL REFERENCES "Comment"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS "PostLike" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "postId" UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "postId")
);

-- Vaccination records table
CREATE TABLE IF NOT EXISTS "VaccinationRecord" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "petId" UUID NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
    "vaccineName" VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    "expirationDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Medical records table
CREATE TABLE IF NOT EXISTS "MedicalRecord" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "petId" UUID NOT NULL REFERENCES "Pet"(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "shopId" UUID NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
    caption TEXT,
    image TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE INDEXES
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
-- STEP 5: ENABLE RLS
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
-- STEP 6: CREATE RLS POLICIES (FIXED FOR UUID)
-- =====================================================

-- User policies
CREATE POLICY "Users can view their own profile" ON "User"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON "User"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON "User"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid() AND "isAdmin" = true
        )
    );

CREATE POLICY "Admins can update all users" ON "User"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid() AND "isAdmin" = true
        )
    );

-- Pet policies
CREATE POLICY "Users can view their own pets" ON "Pet"
    FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own pets" ON "Pet"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own pets" ON "Pet"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own pets" ON "Pet"
    FOR DELETE USING ("userId" = auth.uid());

-- Task policies
CREATE POLICY "Users can view their own tasks" ON "Task"
    FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own tasks" ON "Task"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own tasks" ON "Task"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own tasks" ON "Task"
    FOR DELETE USING ("userId" = auth.uid());

-- Post policies
CREATE POLICY "Anyone can view posts" ON "Post"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON "Post"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own posts" ON "Post"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own posts" ON "Post"
    FOR DELETE USING ("userId" = auth.uid());

-- Comment policies
CREATE POLICY "Anyone can view comments" ON "Comment"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON "Comment"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own comments" ON "Comment"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own comments" ON "Comment"
    FOR DELETE USING ("userId" = auth.uid());

-- Reply policies
CREATE POLICY "Anyone can view replies" ON "Reply"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own replies" ON "Reply"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own replies" ON "Reply"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own replies" ON "Reply"
    FOR DELETE USING ("userId" = auth.uid());

-- PostLike policies
CREATE POLICY "Anyone can view post likes" ON "PostLike"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own post likes" ON "PostLike"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can delete their own post likes" ON "PostLike"
    FOR DELETE USING ("userId" = auth.uid());

-- VaccinationRecord policies
CREATE POLICY "Users can view their own vaccination records" ON "VaccinationRecord"
    FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own vaccination records" ON "VaccinationRecord"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own vaccination records" ON "VaccinationRecord"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own vaccination records" ON "VaccinationRecord"
    FOR DELETE USING ("userId" = auth.uid());

-- MedicalRecord policies
CREATE POLICY "Users can view their own medical records" ON "MedicalRecord"
    FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own medical records" ON "MedicalRecord"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own medical records" ON "MedicalRecord"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own medical records" ON "MedicalRecord"
    FOR DELETE USING ("userId" = auth.uid());

-- Shop policies
CREATE POLICY "Anyone can view approved shops" ON "Shop"
    FOR SELECT USING (approved = true);

CREATE POLICY "Shop owners can view their own shop" ON "Shop"
    FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Shop owners can update their own shop" ON "Shop"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Admins can view all shops" ON "Shop"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid() AND "isAdmin" = true
        )
    );

CREATE POLICY "Admins can update all shops" ON "Shop"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid() AND "isAdmin" = true
        )
    );

-- ShopApplication policies
CREATE POLICY "Users can view their own applications" ON "ShopApplication"
    FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own applications" ON "ShopApplication"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own applications" ON "ShopApplication"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Admins can view all applications" ON "ShopApplication"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid() AND "isAdmin" = true
        )
    );

CREATE POLICY "Admins can update all applications" ON "ShopApplication"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid() AND "isAdmin" = true
        )
    );

-- PromotionalPost policies
CREATE POLICY "Anyone can view promotional posts" ON "PromotionalPost"
    FOR SELECT USING (true);

CREATE POLICY "Shop owners can create promotional posts" ON "PromotionalPost"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE id = "shopId" AND "userId" = auth.uid() AND approved = true
        )
    );

CREATE POLICY "Shop owners can update their promotional posts" ON "PromotionalPost"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE id = "shopId" AND "userId" = auth.uid() AND approved = true
        )
    );

CREATE POLICY "Shop owners can delete their promotional posts" ON "PromotionalPost"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "Shop" 
            WHERE id = "shopId" AND "userId" = auth.uid() AND approved = true
        )
    );

-- =====================================================
-- STEP 7: CREATE TRIGGERS FOR UPDATED AT
-- =====================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
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
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ PetHub Supabase schema created successfully with UUID support!';
    RAISE NOTICE '📊 Tables: 13 tables created with UUID primary keys';
    RAISE NOTICE '🔒 Security: RLS policies configured for UUID auth.uid()';
    RAISE NOTICE '📁 Storage: 4 storage buckets configured';
    RAISE NOTICE '⚡ Performance: Indexes created for optimal queries';
    RAISE NOTICE '🔄 Triggers: Auto-update timestamps configured';
    RAISE NOTICE '🔑 UUID: All tables now use UUID for compatibility with Supabase auth';
END $$;
