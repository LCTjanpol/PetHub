/*
  Warnings:

  - Added the required column `name` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the column as nullable
ALTER TABLE "Task" ADD COLUMN "name" TEXT;

-- Update existing records to use description as name
UPDATE "Task" SET "name" = "description" WHERE "name" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "Task" ALTER COLUMN "name" SET NOT NULL;
