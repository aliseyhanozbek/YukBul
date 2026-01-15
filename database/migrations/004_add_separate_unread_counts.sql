-- Add separate unread count columns for customer and driver
ALTER TABLE "conversations" 
ADD COLUMN IF NOT EXISTS "customer_unread_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "driver_unread_count" INTEGER DEFAULT 0;

-- Migrate existing unread data (if any) to driver_unread_count (assuming existing unread was for driver)
-- You may need to adjust this based on your data
UPDATE "conversations" 
SET "driver_unread_count" = COALESCE("unread", 0)
WHERE "driver_unread_count" = 0;

