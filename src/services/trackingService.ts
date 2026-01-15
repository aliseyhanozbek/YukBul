/**
 * Tracking Service
 * 
 * Service layer for shipment tracking-related database operations.
 * Handles all CRUD operations for the shipmentTracking and timeline tables.
 */

import { supabase } from '@/lib/supabaseClient';
import type {
  ShipmentTracking,
  ShipmentTrackingInsert,
  ShipmentTrackingUpdate,
  Timeline,
  TimelineInsert,
} from '@/types/database.types';

/**
 * Get tracking by order ID
 */
export const getTrackingByOrderId = async (orderId: number): Promise<ShipmentTracking | null> => {
  const { data, error } = await supabase
    .from('shipmentTracking')
    .select('*')
    .eq('orderId', orderId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching tracking:', error);
    throw error;
  }

  return data;
};

/**
 * Create or update tracking
 */
export const upsertTracking = async (
  trackingData: ShipmentTrackingInsert & { orderId: number }
): Promise<ShipmentTracking> => {
  // Check if tracking already exists
  const existing = await supabase
    .from('shipmentTracking')
    .select('id')
    .eq('orderId', trackingData.orderId)
    .maybeSingle();

  if (existing.data) {
    // Update existing
    const { data, error } = await supabase
      .from('shipmentTracking')
      .update({
        ...trackingData,
        lastUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', existing.data.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tracking:', error);
      throw error;
    }

    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('shipmentTracking')
      .insert(trackingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating tracking:', error);
      throw error;
    }

    return data;
  }
};

/**
 * Get timeline by order ID
 */
export const getTimelineByOrderId = async (orderId: number): Promise<Timeline[]> => {
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('orderId', orderId)
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('Error fetching timeline:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create timeline entry
 */
export const createTimelineEntry = async (timelineData: TimelineInsert): Promise<Timeline> => {
  const { data, error } = await supabase
    .from('timeline')
    .insert(timelineData)
    .select()
    .single();

  if (error) {
    console.error('Error creating timeline entry:', error);
    throw error;
  }

  return data;
};

/**
 * Update timeline entry
 */
export const updateTimelineEntry = async (
  timelineId: number,
  updates: Partial<Timeline>
): Promise<Timeline> => {
  const { data, error } = await supabase
    .from('timeline')
    .update(updates)
    .eq('id', timelineId)
    .select()
    .single();

  if (error) {
    console.error('Error updating timeline entry:', error);
    throw error;
  }

  return data;
};

