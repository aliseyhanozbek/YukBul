# UUID Migration Guide

## Problem
The database tables (`listings`, `orders`, `conversations`, `reviews`, `locationSharing`, `statistics`) have `driverId` and `customerId` columns that are still `int8` (bigint) instead of `UUID`. This causes `22P02` errors when trying to insert UUID strings.

## Solution

### Step 1: Run SQL Migration
Execute the SQL commands in `migration_uuid_fix.sql` in your Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `migration_uuid_fix.sql`
3. Execute the script

**Important Notes:**
- This migration assumes tables are empty or you've backed up your data
- The `USING NULL` clause will set all existing values to NULL (safe for empty tables)
- Foreign key constraints will be dropped and recreated

### Step 2: Verify Migration
After running the migration, verify the column types:

```sql
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('listings', 'orders', 'conversations', 'reviews', 'locationSharing', 'statistics')
  AND column_name IN ('driverId', 'customerId')
ORDER BY table_name, column_name;
```

All `driverId` and `customerId` columns should show `data_type = 'uuid'`.

### Step 3: Code Verification
The code has been updated to:
- ✅ Always use `user.id` as a string (UUID) - never convert to number
- ✅ Validate UUID format before database operations
- ✅ TypeScript types correctly define UUID fields as `string | null`
- ✅ All `.eq('driverId', user.id)` queries use UUID strings

### Files Updated
- `src/pages/sofor/IlanOlustur.tsx` - Added UUID validation
- `src/lib/supabaseClient.ts` - Types already correct (string | null)
- All query files already use UUID strings correctly

### Testing
After migration:
1. Try creating a new listing
2. Try fetching listings
3. Check that no `22P02` errors occur
4. Verify that user IDs are stored correctly as UUIDs









