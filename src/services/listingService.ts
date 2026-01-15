/**
 * Listing Service
 * 
 * Service layer for listing-related database operations.
 * Handles all CRUD operations for the listings table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { Listing, ListingInsert, ListingUpdate } from '@/types/database.types';

/**
 * Get listing by ID
 */
export const getListingById = async (listingId: number): Promise<Listing | null> => {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching listing:', error);
    throw error;
  }

  return data;
};

/**
 * Get all listings with optional filters
 */
export const getListings = async (filters?: {
  driverId?: string;
  status?: Listing['status'] | Listing['status'][];
  from?: string;
  to?: string;
  date?: string;
}): Promise<Listing[]> => {
  let query = supabase
    .from('listings')
    .select('*');

  if (filters?.driverId) {
    query = query.eq('driverId', filters.driverId);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.from) {
    query = query.ilike('from', `%${filters.from}%`);
  }

  if (filters?.to) {
    query = query.ilike('to', `%${filters.to}%`);
  }

  if (filters?.date) {
    query = query.eq('date', filters.date);
  }

  const { data, error } = await query.order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get active listings (status: 'Aktif' or 'Beklemede')
 */
export const getActiveListings = async (driverId?: string): Promise<Listing[]> => {
  return getListings({
    driverId,
    status: ['Aktif', 'Beklemede'],
  });
};

/**
 * Create a new listing
 */
export const createListing = async (listingData: ListingInsert): Promise<Listing> => {
  const { data, error } = await supabase
    .from('listings')
    .insert(listingData)
    .select()
    .single();

  if (error) {
    console.error('Error creating listing:', error);
    throw error;
  }

  return data;
};

/**
 * Update listing
 */
export const updateListing = async (
  listingId: number,
  updates: ListingUpdate
): Promise<Listing> => {
  const { data, error } = await supabase
    .from('listings')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating listing:', error);
    throw error;
  }

  return data;
};

/**
 * Delete listing
 */
export const deleteListing = async (listingId: number): Promise<void> => {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

/**
 * Increment listing views
 */
export const incrementListingViews = async (listingId: number): Promise<void> => {
  const { error } = await supabase.rpc('increment_listing_views', {
    listing_id: listingId,
  });

  if (error) {
    // Fallback to manual update if RPC fails
    const listing = await getListingById(listingId);
    if (listing) {
      await updateListing(listingId, {
        views: listing.views + 1,
      });
    } else {
      throw error;
    }
  }
};

