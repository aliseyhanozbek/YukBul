/**
 * useUserProfile Hook
 * 
 * Custom hook for fetching and managing user profile data.
 * Uses the userService for all database operations.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById } from '@/services/userService';
import type { User } from '@/types/database.types';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
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

        const userProfile = await getUserById(user.id);
        setProfile(userProfile);
      } catch (error: any) {
        // If it's a "not found" error (PGRST116), that's okay - profile might not exist yet
        if (error?.code === 'PGRST116') {
          console.log('User profile not found, will be created on first update');
          setProfile(null);
        } else {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
};
