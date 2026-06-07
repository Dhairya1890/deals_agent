import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;

const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const isServiceKeyValid = serviceKey && 
  serviceKey !== 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE' && 
  serviceKey.trim() !== '';

const supabaseKey = isServiceKeyValid ? serviceKey : anonKey;

if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: Supabase URL or Key is missing from environment.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
