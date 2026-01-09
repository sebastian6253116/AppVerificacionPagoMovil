import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Evitar errores en tiempo de construcción si las variables no están definidas
// En tiempo de ejecución, si faltan, las llamadas fallarán apropiadamente
export const supabase = createClient(supabaseUrl, supabaseKey);
