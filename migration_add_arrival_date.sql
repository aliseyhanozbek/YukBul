-- Migration: Add arrivalDate column to listings table
-- This adds the "Tahmini Varış Tarihi" (Estimated Arrival Date) field

-- Add arrivalDate column to listings table
ALTER TABLE "listings" 
  ADD COLUMN IF NOT EXISTS "arrivalDate" TEXT;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN "listings"."arrivalDate" IS 'Tahmini varış tarihi (YYYY-MM-DD formatında)';








