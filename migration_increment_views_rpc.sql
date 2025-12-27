-- Migration: Create RPC function to increment listing views
-- This function can be used to atomically increment views count
-- Usage: SELECT increment_listing_views(listing_id);

CREATE OR REPLACE FUNCTION increment_listing_views(listing_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "listings"
  SET "views" = "views" + 1,
      "updatedAt" = NOW()
  WHERE "id" = listing_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_listing_views(BIGINT) TO authenticated;








