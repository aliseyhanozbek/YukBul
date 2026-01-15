/**
 * Statistics Service
 * 
 * Service layer for statistics-related database operations.
 * Handles all CRUD operations for the statistics table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { Statistics, StatisticsInsert, StatisticsUpdate } from '@/types/database.types';

/**
 * Get statistics by driver ID
 */
export const getStatisticsByDriverId = async (driverId: string): Promise<Statistics[]> => {
  const { data, error } = await supabase
    .from('statistics')
    .select('*')
    .eq('driverId', driverId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get statistics by ID
 */
export const getStatisticsById = async (statisticsId: number): Promise<Statistics | null> => {
  const { data, error } = await supabase
    .from('statistics')
    .select('*')
    .eq('id', statisticsId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }

  return data;
};

/**
 * Create statistics record
 */
export const createStatistics = async (statisticsData: StatisticsInsert): Promise<Statistics> => {
  const { data, error } = await supabase
    .from('statistics')
    .insert(statisticsData)
    .select()
    .single();

  if (error) {
    console.error('Error creating statistics:', error);
    throw error;
  }

  return data;
};

/**
 * Update statistics
 */
export const updateStatistics = async (
  statisticsId: number,
  updates: StatisticsUpdate
): Promise<Statistics> => {
  const { data, error } = await supabase
    .from('statistics')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', statisticsId)
    .select()
    .single();

  if (error) {
    console.error('Error updating statistics:', error);
    throw error;
  }

  return data;
};

/**
 * Delete statistics
 */
export const deleteStatistics = async (statisticsId: number): Promise<void> => {
  const { error } = await supabase
    .from('statistics')
    .delete()
    .eq('id', statisticsId);

  if (error) {
    console.error('Error deleting statistics:', error);
    throw error;
  }
};

