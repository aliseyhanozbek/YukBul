/**
 * User Service
 * 
 * Service layer for user-related database operations.
 * Handles all CRUD operations for the users table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { User, UserInsert, UserUpdate } from '@/types/database.types';

/**
 * Get user profile by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }

  return data;
};

/**
 * Get user profile by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }

  return data;
};

/**
 * Create a new user profile
 */
export const createUser = async (userData: UserInsert): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data;
};

/**
 * Update user profile
 */
export const updateUser = async (
  userId: string,
  updates: UserUpdate
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  return data;
};

/**
 * Get users by company ID
 */
export const getUsersByCompanyId = async (companyId: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    console.error('Error fetching users by company:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: 'musteri' | 'sofor' | 'sirket'): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role);

  if (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }

  return data || [];
};

