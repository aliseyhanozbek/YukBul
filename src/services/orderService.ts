/**
 * Order Service
 * 
 * Service layer for order-related database operations.
 * Handles all CRUD operations for the orders table.
 */

import { supabase } from '@/lib/supabaseClient';
import type { Order, OrderInsert, OrderUpdate } from '@/types/database.types';

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching order:', error);
    throw error;
  }

  return data;
};

/**
 * Get orders with optional filters
 */
export const getOrders = async (filters?: {
  customerId?: string;
  driverId?: string;
  listingId?: number;
  status?: Order['status'] | Order['status'][];
}): Promise<Order[]> => {
  let query = supabase
    .from('orders')
    .select('*');

  if (filters?.customerId) {
    query = query.eq('customerId', filters.customerId);
  }

  if (filters?.driverId) {
    query = query.eq('driverId', filters.driverId);
  }

  if (filters?.listingId) {
    query = query.eq('listingId', filters.listingId);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  const { data, error } = await query.order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get active orders for a user
 */
export const getActiveOrders = async (userId: string, role: 'customer' | 'driver'): Promise<Order[]> => {
  const filters: any = {
    status: ['Onay Bekliyor', 'Hazırlanıyor', 'Yolda'],
  };

  if (role === 'customer') {
    filters.customerId = userId;
  } else {
    filters.driverId = userId;
  }

  return getOrders(filters);
};

/**
 * Create a new order
 */
export const createOrder = async (orderData: OrderInsert): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }

  return data;
};

/**
 * Update order
 */
export const updateOrder = async (
  orderId: number,
  updates: OrderUpdate
): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }

  return data;
};

/**
 * Delete order
 */
export const deleteOrder = async (orderId: number): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

