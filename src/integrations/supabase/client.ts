// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ktmqwhkywxogxktuqcfx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bXF3aGt5d3hvZ3hrdHVxY2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MDcxMjcsImV4cCI6MjA1NDA4MzEyN30.d6oKYok-zLXZoZuL50rQkLV6qI8z1A52IXQQ0W7Kbkw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
