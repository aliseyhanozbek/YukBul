/**
 * Message Service
 * 
 * Service layer for message-related database operations.
 * Handles all CRUD operations for the messages table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { Message, MessageInsert, MessageUpdate } from '@/types/database.types';

/**
 * Get messages for a conversation
 */
export const getMessagesByConversationId = async (conversationId: number): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversationId', conversationId)
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new message
 */
export const createMessage = async (messageData: MessageInsert): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    throw error;
  }

  return data;
};

/**
 * Update message
 */
export const updateMessage = async (
  messageId: number,
  updates: MessageUpdate
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error updating message:', error);
    throw error;
  }

  return data;
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: number): Promise<Message> => {
  return updateMessage(messageId, { read: true });
};

/**
 * Mark all messages in a conversation as read
 */
export const markAllMessagesAsRead = async (conversationId: number): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversationId', conversationId)
    .eq('read', false);

  if (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Delete message
 */
export const deleteMessage = async (messageId: number): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

