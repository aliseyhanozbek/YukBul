import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string, role: 'musteri' | 'sofor' | 'sirket', companyData?: { name: string; taxNo?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("=== Sign In Attempt ===");
    console.log("Email:", email);
    console.log("Password length:", password.length);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Detaylı hata loglama
      if (error) {
        console.error("❌ Supabase Auth Error:");
        console.error("Error message:", error.message);
        console.error("Error status:", error.status);
        console.error("Error name:", error.name);
        console.error("Full error object:", JSON.stringify(error, null, 2));

        // HTTP response detayları varsa
        if ((error as any).response) {
          console.error("HTTP Response:", (error as any).response);
        }

        // Network error kontrolü
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          console.error("⚠️ Network error detected. Check your internet connection and Supabase URL.");
        }

        // API key hatası kontrolü
        if (error.status === 401 || error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          console.error("⚠️ API Key Error Detected!");
          console.error("Please verify:");
          console.error("1. .env.local file exists in project root");
          console.error("2. VITE_SUPABASE_ANON_KEY is correct (from Supabase Dashboard > Settings > API)");
          console.error("3. No quotes around values in .env.local");
          console.error("4. No trailing spaces in .env.local");
        }
      } else {
        console.log("✅ Sign in successful");
        console.log("User ID:", data.user?.id);
        console.log("User email:", data.user?.email);
      }

      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
      }

      return { error };
    } catch (err) {
      // Beklenmeyen hatalar için
      console.error("❌ Unexpected error during sign in:", err);
      const authError: AuthError = {
        name: 'UnexpectedError',
        message: err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu',
        status: 500,
      };
      return { error: authError };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'musteri' | 'sofor' | 'sirket',
    companyData?: { name: string; taxNo?: string }
  ) => {
    // Step 1: Create user in auth.users via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          role: role,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Step 2: If user was created successfully, get the UUID from auth.users
    if (!data.user) {
      return {
        error: new Error('Kullanıcı oluşturulamadı') as AuthError
      };
    }

    const userId = data.user.id; // This is the UUID from auth.users

    // Step 3: Validate that userId is a string (UUID)
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid user ID type:', typeof userId, userId);
      await supabase.auth.signOut();
      return {
        error: new Error('Geçersiz kullanıcı ID tipi') as AuthError
      };
    }

    // Step 4: Insert user profile into public.users table using the UUID
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId, // UUID string from auth.users - must be string, never number
        email: data.user.email!,
        name: name,
        role: role,
        // Password is NOT stored in public.users - it's only in auth.users
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // If profile creation fails, sign out the user to clean up auth.users
      await supabase.auth.signOut();
      return {
        error: new Error(profileError.message || 'Kullanıcı profili oluşturulamadı') as AuthError
      };
    }

    // Step 4.5: If role is 'sirket', create company and link it
    if (role === 'sirket' && companyData) {
      // 1. Create Company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          owner_id: userId,
          name: companyData.name,
          tax_no: companyData.taxNo,
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        // Don't fail the whole registration, but log it. User is created but no company.
        // Ideally we should delete user, but for now let's just log.
      } else if (company) {
        // 2. Link company to user
        const { error: updateError } = await supabase
          .from('users')
          .update({ company_id: company.id })
          .eq('id', userId);

        if (updateError) {
          console.error('Error linking company to user:', updateError);
        }
      }
    }

    // Step 5: Update local state with the new user and session
    setUser(data.user);
    setSession(data.session);

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

