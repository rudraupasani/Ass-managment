import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpsjqpefokafrpuoupmn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6e_MsAlm3Hoa0HjQQNXBJg_ewODFEh4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
