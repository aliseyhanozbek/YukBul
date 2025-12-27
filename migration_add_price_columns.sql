-- Add price columns to conversations table for price verification
ALTER TABLE "conversations" 
ADD COLUMN IF NOT EXISTS "customer_price" TEXT,
ADD COLUMN IF NOT EXISTS "driver_price" TEXT;

