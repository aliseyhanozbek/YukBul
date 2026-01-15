/**
 * Location Service
 * 
 * Service layer for location sharing-related database operations.
 * Handles all CRUD operations for the locationSharing table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { LocationSharing, LocationSharingInsert, LocationSharingUpdate } from '@/types/database.types';

/**
 * Get location sharing by driver ID
 */
export const getLocationByDriverId = async (driverId: string): Promise<LocationSharing | null> => {
  const { data, error } = await supabase
    .from('locationSharing')
    .select('*')
    .eq('driverId', driverId)
    .eq('isSharing', true)
    .order('lastUpdate', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching location:', error);
    throw error;
  }

  return data;
};

/**
 * Get location sharing by order ID
 */
export const getLocationByOrderId = async (orderId: number): Promise<LocationSharing | null> => {
  const { data, error } = await supabase
    .from('locationSharing')
    .select('*')
    .eq('orderId', orderId)
    .eq('isSharing', true)
    .order('lastUpdate', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching location by order:', error);
    throw error;
  }

  return data;
};

/**
 * Create or update location sharing
 */
export const upsertLocationSharing = async (
  locationData: LocationSharingInsert & { driverId: string; orderId: number }
): Promise<LocationSharing> => {
  // Check if location sharing already exists
  const existing = await supabase
    .from('locationSharing')
    .select('id')
    .eq('driverId', locationData.driverId)
    .eq('orderId', locationData.orderId)
    .maybeSingle();

  if (existing.data) {
    // Update existing
    const { data, error } = await supabase
      .from('locationSharing')
      .update({
        ...locationData,
        lastUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', existing.data.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating location sharing:', error);
      throw error;
    }

    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('locationSharing')
      .insert(locationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating location sharing:', error);
      throw error;
    }

    return data;
  }
};

/**
 * Stop location sharing
 */
export const stopLocationSharing = async (
  driverId: string,
  orderId: number
): Promise<void> => {
  const { error } = await supabase
    .from('locationSharing')
    .update({
      isSharing: false,
      updatedAt: new Date().toISOString(),
    })
    .eq('driverId', driverId)
    .eq('orderId', orderId);

  if (error) {
    console.error('Error stopping location sharing:', error);
    throw error;
  }
};

