import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wbgacppzdyqextjxlgwq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0FCYjpPT8_7AJOa5aYIXgg_xZhkayuN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});