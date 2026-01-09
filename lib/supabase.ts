import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Evitar errores en tiempo de construcción si las variables no están definidas
// Usamos valores placeholder que permiten inicializar el cliente sin lanzar error inmediato.
// Las llamadas fallarán en runtime si las credenciales no son válidas, lo cual es el comportamiento esperado si falta configuración.
export const supabase = createClient(supabaseUrl, supabaseKey);
