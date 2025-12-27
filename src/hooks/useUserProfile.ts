import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'musteri' | 'sofor';
  address: string | null;
  bio: string | null;
  vehicle: string | null;
  plate: string | null;
  rating: number;
  reviews: number;
  totalShipments: number;
  totalSpent: string;
  avgRating: number;
  memberSince: string | null;
  company_id: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Ensure user.id is a string (UUID)
        if (!user.id || typeof user.id !== 'string') {
          console.error('Invalid user ID:', user.id);
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id) // user.id is already a UUID string
          .maybeSingle(); // Use maybeSingle instead of single to handle missing profiles gracefully

        if (error) {
          // If it's a "not found" error (PGRST116), that's okay - profile might not exist yet
          // Don't throw error, just return null gracefully
          if (error.code === 'PGRST116') {
            console.log('User profile not found, will be created on first update');
            setProfile(null);
          } else {
            // Log error but don't crash - return null gracefully
            console.error('Error fetching user profile:', error);
            setProfile(null);
          }
        } else {
          // data can be null if profile doesn't exist - that's okay
          // Never throw error, always return null if profile doesn't exist
          setProfile(data || null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
};


