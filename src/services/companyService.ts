/**
 * Company Service
 * 
 * Service layer for company-related database operations.
 * Handles all CRUD operations for the companies table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { Company, CompanyInsert, CompanyUpdate } from '@/types/database.types';

/**
 * Get company by ID
 */
export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching company:', error);
    throw error;
  }

  return data;
};

/**
 * Get company by owner ID
 */
export const getCompanyByOwnerId = async (ownerId: string): Promise<Company | null> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching company by owner:', error);
    throw error;
  }

  return data;
};

/**
 * Get all companies
 */
export const getAllCompanies = async (): Promise<Company[]> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new company
 */
export const createCompany = async (companyData: CompanyInsert): Promise<Company> => {
  const { data, error } = await supabase
    .from('companies')
    .insert(companyData)
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    throw error;
  }

  return data;
};

/**
 * Update company
 */
export const updateCompany = async (
  companyId: string,
  updates: CompanyUpdate
): Promise<Company> => {
  const { data, error } = await supabase
    .from('companies')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }

  return data;
};

/**
 * Delete company
 */
export const deleteCompany = async (companyId: string): Promise<void> => {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

