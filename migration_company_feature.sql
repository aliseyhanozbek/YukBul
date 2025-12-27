-- Create companies table
CREATE TABLE IF NOT EXISTS "companies" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "owner_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "tax_no" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "logo_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add company_id to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "company_id" UUID REFERENCES "companies"("id") ON DELETE SET NULL;

-- Update role check constraint safely
-- First drop the existing constraint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check";
-- Then add the new one including 'sirket'
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" 
  CHECK ("role" IN ('musteri', 'sofor', 'sirket'));

-- Enable RLS on companies
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;

-- Policies for companies
-- 1. Companies are viewable by everyone (needed for drivers to join)
CREATE POLICY "Companies are viewable by everyone" 
ON "companies" FOR SELECT 
USING (true);

-- 2. Only owner can update their company
CREATE POLICY "Users can update own company" 
ON "companies" FOR UPDATE 
USING (auth.uid() = owner_id);

-- 3. Only owner can insert (during registration)
CREATE POLICY "Users can insert own company" 
ON "companies" FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Add simple index for performance
CREATE INDEX IF NOT EXISTS "idx_users_company_id" ON "users"("company_id");
