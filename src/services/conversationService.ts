/**
 * Conversation Service
 * 
 * Service layer for conversation-related database operations.
 * Handles all CRUD operations for the conversations table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { Conversation, ConversationInsert, ConversationUpdate } from '@/types/database.types';

/**
 * Get conversation by ID
 */
export const getConversationById = async (conversationId: number): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }

  return data;
};

/**
 * Get conversation by participants and listing
 */
export const getConversationByParticipants = async (
  customerId: string,
  driverId: string,
  listingId?: number
): Promise<Conversation | null> => {
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('customerId', customerId)
    .eq('driverId', driverId);

  if (listingId) {
    query = query.eq('listingId', listingId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }

  return data;
};

/**
 * Get conversations for a user
 */
export const getConversations = async (userId: string, role: 'customer' | 'driver'): Promise<Conversation[]> => {
  let query = supabase
    .from('conversations')
    .select('*');

  if (role === 'customer') {
    query = query.eq('customerId', userId);
  } else {
    query = query.eq('driverId', userId);
  }

  const { data, error } = await query
    .order('updatedAt', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new conversation
 */
export const createConversation = async (conversationData: ConversationInsert): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .insert(conversationData)
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return data;
};

/**
 * Update conversation
 */
export const updateConversation = async (
  conversationId: number,
  updates: ConversationUpdate
): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }

  return data;
};

/**
 * Update unread count for conversation
 */
export const updateUnreadCount = async (
  conversationId: number,
  role: 'customer' | 'driver',
  increment: boolean = true
): Promise<Conversation> => {
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const updates: ConversationUpdate = {};
  if (role === 'customer') {
    updates.customer_unread_count = increment
      ? conversation.customer_unread_count + 1
      : 0;
  } else {
    updates.driver_unread_count = increment
      ? conversation.driver_unread_count + 1
      : 0;
  }

  return updateConversation(conversationId, updates);
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (
  conversationId: number,
  role: 'customer' | 'driver'
): Promise<Conversation> => {
  return updateUnreadCount(conversationId, role, false);
};

