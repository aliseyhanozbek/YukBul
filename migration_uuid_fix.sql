-- Migration: Convert all user_id columns from int8 (bigint) to UUID
-- This script converts driverId and customerId columns to UUID type
-- IMPORTANT: Run this only if tables are empty or after backing up data

-- Step 1: Drop existing foreign key constraints
ALTER TABLE "listings" DROP CONSTRAINT IF EXISTS "listings_driverId_fkey";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_customerId_fkey";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_driverId_fkey";
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_customerId_fkey";
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_driverId_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_customerId_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_driverId_fkey";
ALTER TABLE "locationSharing" DROP CONSTRAINT IF EXISTS "locationSharing_driverId_fkey";
ALTER TABLE "statistics" DROP CONSTRAINT IF EXISTS "statistics_driverId_fkey";

-- Step 2: Convert columns to UUID type
-- Note: This will fail if there's existing data that can't be converted
-- If tables are empty, this is safe

-- Listings table
ALTER TABLE "listings" 
  ALTER COLUMN "driverId" TYPE UUID USING NULL;

-- Orders table
ALTER TABLE "orders" 
  ALTER COLUMN "customerId" TYPE UUID USING NULL,
  ALTER COLUMN "driverId" TYPE UUID USING NULL;

-- Conversations table
ALTER TABLE "conversations" 
  ALTER COLUMN "customerId" TYPE UUID USING NULL,
  ALTER COLUMN "driverId" TYPE UUID USING NULL;

-- Reviews table
ALTER TABLE "reviews" 
  ALTER COLUMN "customerId" TYPE UUID USING NULL,
  ALTER COLUMN "driverId" TYPE UUID USING NULL;

-- Location Sharing table
ALTER TABLE "locationSharing" 
  ALTER COLUMN "driverId" TYPE UUID USING NULL;

-- Statistics table
ALTER TABLE "statistics" 
  ALTER COLUMN "driverId" TYPE UUID USING NULL;

-- Step 3: Re-add foreign key constraints
ALTER TABLE "listings" 
  ADD CONSTRAINT "listings_driverId_fkey" 
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "orders" 
  ADD CONSTRAINT "orders_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "orders_driverId_fkey" 
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "conversations" 
  ADD CONSTRAINT "conversations_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "conversations_driverId_fkey" 
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "reviews" 
  ADD CONSTRAINT "reviews_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "reviews_driverId_fkey" 
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "locationSharing" 
  ADD CONSTRAINT "locationSharing_driverId_fkey" 
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "statistics" 
  ADD CONSTRAINT "statistics_driverId_fkey" 
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Verification: Check column types
-- Run these to verify the migration:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('listings', 'orders', 'conversations', 'reviews', 'locationSharing', 'statistics')
-- AND column_name IN ('driverId', 'customerId')
-- ORDER BY table_name, column_name;









