/**
 * Clears old/demo data from localStorage and sessionStorage
 * Should be called on app initialization
 */
export const clearOldStorage = () => {
  try {
    // Clear any old demo user data
    const keysToRemove: string[] = [];
    
    // Check all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Remove old demo data patterns
        if (
          key.includes('demo') ||
          key.includes('Mehmet') ||
          key.includes('Ali') ||
          key.includes('Ayşe') ||
          key.includes('mock') ||
          key.includes('fake')
        ) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove localStorage key: ${key}`, e);
      }
    });

    // Clear Supabase auth storage if it contains invalid data
    // Supabase stores auth data in localStorage with specific keys
    const supabaseAuthKeys = [
      'sb-*-auth-token',
      'supabase.auth.token'
    ];

    // Note: We don't clear actual Supabase auth tokens as they're needed
    // Only clear if they're clearly invalid/demo data

  } catch (error) {
    console.warn('Error during storage cleanup:', error);
  }
};









