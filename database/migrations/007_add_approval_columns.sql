-- Add approval columns to conversations table
ALTER TABLE "conversations" 
ADD COLUMN IF NOT EXISTS "customer_approved" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "driver_approved" BOOLEAN DEFAULT false;

