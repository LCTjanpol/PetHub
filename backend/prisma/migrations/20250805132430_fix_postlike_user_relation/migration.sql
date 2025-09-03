/*
  Warnings:

  - Made the column `isAvailable` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rating` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalReviews` on table `Shop` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Pet" ALTER COLUMN "birthdate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "availableDays" DROP DEFAULT,
ALTER COLUMN "bio" DROP DEFAULT,
ALTER COLUMN "closingTime" DROP DEFAULT,
ALTER COLUMN "contactNumber" DROP DEFAULT,
ALTER COLUMN "isAvailable" SET NOT NULL,
ALTER COLUMN "openingTime" DROP DEFAULT,
ALTER COLUMN "rating" SET NOT NULL,
ALTER COLUMN "shopLocation" DROP DEFAULT,
ALTER COLUMN "shopMessage" DROP DEFAULT,
ALTER COLUMN "shopName" DROP DEFAULT,
ALTER COLUMN "shopType" DROP DEFAULT,
ALTER COLUMN "totalReviews" SET NOT NULL,
ALTER COLUMN "userId" DROP DEFAULT;
