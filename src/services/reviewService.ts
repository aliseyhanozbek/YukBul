/**
 * Review Service
 * 
 * Service layer for review-related database operations.
 * Handles all CRUD operations for the reviews table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { Review, ReviewInsert, ReviewUpdate } from '@/types/database.types';

/**
 * Get review by ID
 */
export const getReviewById = async (reviewId: number): Promise<Review | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching review:', error);
    throw error;
  }

  return data;
};

/**
 * Get reviews by driver ID
 */
export const getReviewsByDriverId = async (driverId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('driverId', driverId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get reviews by order ID
 */
export const getReviewsByOrderId = async (orderId: number): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('orderId', orderId);

  if (error) {
    console.error('Error fetching reviews by order:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new review
 */
export const createReview = async (reviewData: ReviewInsert): Promise<Review> => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw error;
  }

  return data;
};

/**
 * Update review
 */
export const updateReview = async (
  reviewId: number,
  updates: ReviewUpdate
): Promise<Review> => {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw error;
  }

  return data;
};

/**
 * Delete review
 */
export const deleteReview = async (reviewId: number): Promise<void> => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

