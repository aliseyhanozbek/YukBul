import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * Check if a conversation exists between a customer and driver for a specific listing.
 * If it exists, return the conversation ID. If not, create a new conversation and return its ID.
 * 
 * @param customerId - UUID of the customer (current logged-in user)
 * @param listingId - BIGINT ID of the listing
 * @returns The conversation ID (BIGINT) or null if there's an error
 */
export const getOrCreateConversation = async (
  customerId: string,
  listingId: number
): Promise<number | null> => {
  try {
    // First, get the listing to find the driverId
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('driverId, from, to')
      .eq('id', listingId)
      .single();

    if (listingError || !listingData) {
      console.error('Error fetching listing:', listingError);
      toast.error('İlan bilgisi alınamadı');
      return null;
    }

    if (!listingData.driverId) {
      toast.error('İlan sahibi bulunamadı');
      return null;
    }

    const driverId = listingData.driverId;

    // Check if conversation already exists
    const { data: existingConv, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('customerId', customerId)
      .eq('driverId', driverId)
      .eq('listingId', listingId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking conversation:', checkError);
      toast.error('Konuşma kontrol edilirken bir hata oluştu');
      return null;
    }

    // If conversation exists, return its ID
    if (existingConv) {
      return existingConv.id;
    }

    // Create route string from listing
    const route = `${listingData.from} → ${listingData.to}`;

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        customerId: customerId,
        driverId: driverId,
        listingId: listingId,
        route: route,
        lastMessage: null,
        time: null,
        unread: 0,
        online: false
      })
      .select('id')
      .single();

    if (createError || !newConv) {
      console.error('Error creating conversation:', createError);
      toast.error('Konuşma oluşturulurken bir hata oluştu');
      return null;
    }

    return newConv.id;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    toast.error('Bir hata oluştu');
    return null;
  }
};







