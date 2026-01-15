# Database Migrations

This directory contains all database migration scripts for the Yük Bul platform.

## Migration Order

Migrations should be run in the following order:

1. **001_uuid_fix.sql** - Converts user ID columns from bigint to UUID
2. **002_increment_views_rpc.sql** - Creates RPC function for incrementing listing views
3. **003_company_feature.sql** - Adds company support and company_id to users
4. **004_add_separate_unread_counts.sql** - Adds separate unread count columns
5. **005_add_price_columns.sql** - Adds price columns to conversations
6. **006_add_arrival_date.sql** - Adds arrival date column to listings
7. **007_add_approval_columns.sql** - Adds approval columns to conversations

## How to Run Migrations

1. Open Supabase Dashboard → SQL Editor
2. Run the base schema first: `database/schema.sql`
3. Run migrations in numerical order (001, 002, 003, etc.)
4. Copy and paste each migration file's contents into the SQL Editor
5. Execute the script

## Important Notes

- Always backup your database before running migrations
- Some migrations assume tables are empty (e.g., UUID migration)
- Check migration comments for specific requirements
- Verify migrations by checking column types and constraints after execution

