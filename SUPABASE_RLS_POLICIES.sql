-- PetHub Supabase RLS Policies
-- Run this in Supabase SQL Editor to secure your database tables

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostLike" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VaccinationRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromotionalPost" ENABLE ROW LEVEL SECURITY;

-- User table policies
CREATE POLICY "Users can view their own profile" ON "User"
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON "User"
FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" ON "User"
FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Pet table policies
CREATE POLICY "Users can view their own pets" ON "Pet"
FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can create pets for themselves" ON "Pet"
FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update their own pets" ON "Pet"
FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete their own pets" ON "Pet"
FOR DELETE USING (auth.uid()::text = "userId"::text);

-- Post table policies
CREATE POLICY "Anyone can view posts" ON "Post"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON "Post"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own posts" ON "Post"
FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete their own posts" ON "Post"
FOR DELETE USING (auth.uid()::text = "userId"::text);

-- Comment table policies
CREATE POLICY "Anyone can view comments" ON "Comment"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON "Comment"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON "Comment"
FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete their own comments" ON "Comment"
FOR DELETE USING (auth.uid()::text = "userId"::text);

-- Reply table policies
CREATE POLICY "Anyone can view replies" ON "Reply"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON "Reply"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own replies" ON "Reply"
FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete their own replies" ON "Reply"
FOR DELETE USING (auth.uid()::text = "userId"::text);

-- PostLike table policies
CREATE POLICY "Anyone can view likes" ON "PostLike"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON "PostLike"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own likes" ON "PostLike"
FOR DELETE USING (auth.uid()::text = "userId"::text);

-- Shop table policies
CREATE POLICY "Anyone can view shops" ON "Shop"
FOR SELECT USING (true);

CREATE POLICY "Shop owners can update their own shop" ON "Shop"
FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Authenticated users can create shops" ON "Shop"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ShopApplication table policies
CREATE POLICY "Users can view their own applications" ON "ShopApplication"
FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Authenticated users can create applications" ON "ShopApplication"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Task table policies
CREATE POLICY "Users can view their own tasks" ON "Task"
FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can create tasks for themselves" ON "Task"
FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update their own tasks" ON "Task"
FOR UPDATE USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete their own tasks" ON "Task"
FOR DELETE USING (auth.uid()::text = "userId"::text);

-- MedicalRecord table policies
CREATE POLICY "Users can view their pet's medical records" ON "MedicalRecord"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "MedicalRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

CREATE POLICY "Users can create medical records for their pets" ON "MedicalRecord"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "MedicalRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

CREATE POLICY "Users can update their pet's medical records" ON "MedicalRecord"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "MedicalRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

CREATE POLICY "Users can delete their pet's medical records" ON "MedicalRecord"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "MedicalRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

-- VaccinationRecord table policies
CREATE POLICY "Users can view their pet's vaccination records" ON "VaccinationRecord"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "VaccinationRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

CREATE POLICY "Users can create vaccination records for their pets" ON "VaccinationRecord"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "VaccinationRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

CREATE POLICY "Users can update their pet's vaccination records" ON "VaccinationRecord"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "VaccinationRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

CREATE POLICY "Users can delete their pet's vaccination records" ON "VaccinationRecord"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "Pet" 
    WHERE "Pet".id = "VaccinationRecord"."petId" 
    AND "Pet"."userId"::text = auth.uid()::text
  )
);

-- PromotionalPost table policies
CREATE POLICY "Anyone can view promotional posts" ON "PromotionalPost"
FOR SELECT USING (true);

CREATE POLICY "Shop owners can create promotional posts" ON "PromotionalPost"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Shop owners can update their own promotional posts" ON "PromotionalPost"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "Shop" 
    WHERE "Shop".id = "PromotionalPost"."shopId" 
    AND "Shop"."userId"::text = auth.uid()::text
  )
);

CREATE POLICY "Shop owners can delete their own promotional posts" ON "PromotionalPost"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "Shop" 
    WHERE "Shop".id = "PromotionalPost"."shopId" 
    AND "Shop"."userId"::text = auth.uid()::text
  )
);
