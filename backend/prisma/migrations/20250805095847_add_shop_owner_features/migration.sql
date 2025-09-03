/*
  Warnings:

  - You are about to drop the column `age` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Shop` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
*/

-- First, add the birthdate column with a default value
ALTER TABLE "Pet" ADD COLUMN "birthdate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Update existing pets to have a birthdate based on their age
UPDATE "Pet" SET "birthdate" = CURRENT_TIMESTAMP - INTERVAL '1 year' * "age";

-- Now make birthdate NOT NULL
ALTER TABLE "Pet" ALTER COLUMN "birthdate" SET NOT NULL;

-- Drop the age column
ALTER TABLE "Pet" DROP COLUMN "age";

-- Add healthCondition column
ALTER TABLE "Pet" ADD COLUMN "healthCondition" TEXT;

-- Add image column to Post
ALTER TABLE "Post" ADD COLUMN "image" TEXT;

-- Handle Shop table migration
-- First, add all new columns with default values
ALTER TABLE "Shop" ADD COLUMN "availableDays" TEXT[] DEFAULT '{}';
ALTER TABLE "Shop" ADD COLUMN "bio" TEXT DEFAULT 'Pet shop';
ALTER TABLE "Shop" ADD COLUMN "closingTime" TEXT DEFAULT '18:00';
ALTER TABLE "Shop" ADD COLUMN "contactNumber" TEXT DEFAULT 'N/A';
ALTER TABLE "Shop" ADD COLUMN "isAvailable" BOOLEAN DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN "openingTime" TEXT DEFAULT '09:00';
ALTER TABLE "Shop" ADD COLUMN "rating" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN "shopImage" TEXT;
ALTER TABLE "Shop" ADD COLUMN "shopLocation" TEXT DEFAULT 'Location not specified';
ALTER TABLE "Shop" ADD COLUMN "shopMessage" TEXT DEFAULT 'Welcome to our pet shop!';
ALTER TABLE "Shop" ADD COLUMN "shopName" TEXT DEFAULT 'Pet Shop';
ALTER TABLE "Shop" ADD COLUMN "shopType" TEXT DEFAULT 'General';
ALTER TABLE "Shop" ADD COLUMN "totalReviews" INTEGER DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN "userId" INTEGER DEFAULT 1;

-- Update existing shops with data from old columns
UPDATE "Shop" SET 
  "shopName" = COALESCE("name", 'Pet Shop'),
  "shopType" = COALESCE("type", 'General');

-- Now make required columns NOT NULL
ALTER TABLE "Shop" ALTER COLUMN "bio" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "closingTime" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "contactNumber" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "openingTime" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "shopLocation" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "shopMessage" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "shopName" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "shopType" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old columns
ALTER TABLE "Shop" DROP COLUMN "name";
ALTER TABLE "Shop" DROP COLUMN "type";

-- Add isShopOwner to User
ALTER TABLE "User" ADD COLUMN "isShopOwner" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "petId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "veterinarian" TEXT NOT NULL,
    "clinic" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopImage" TEXT,
    "shopLocation" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "shopMessage" TEXT NOT NULL,
    "shopType" TEXT NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "availableDays" TEXT[] NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalPost" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "caption" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopReview" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_userId_postId_key" ON "PostLike"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_userId_key" ON "Shop"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopReview_userId_shopId_key" ON "ShopReview"("userId", "shopId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopApplication" ADD CONSTRAINT "ShopApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalPost" ADD CONSTRAINT "PromotionalPost_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReview" ADD CONSTRAINT "ShopReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReview" ADD CONSTRAINT "ShopReview_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
