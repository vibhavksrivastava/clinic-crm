import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a safe Supabase client that doesn't throw during build
let supabaseInstance: any = null;

// Only initialize if we have the required environment variables
if (supabaseUrl && supabaseKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  // Only log warning during server-side runtime in production, not during build
  console.warn('Missing Supabase environment variables - database features will not be available');
}

export const supabase = supabaseInstance;

// Default export for backward compatibility
export default supabaseInstance;
