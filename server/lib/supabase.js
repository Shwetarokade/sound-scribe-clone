import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://vrmnjozgnuwikbjomrra.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybW5qb3pnbnV3aWtiam9tcnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODYzNTEsImV4cCI6MjA2NzY2MjM1MX0.myv14UBTR7OwhNYQiQIrNc5ha8TjF3WNiXlAo3iG1yA";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service key for backend operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error);
  return {
    error: error.message || 'Database operation failed',
    details: error.details || 'An unexpected error occurred'
  };
};