import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Credenciais da conta Master — só a dona da plataforma acessa com isso.
// Não é validado contra o Supabase, é fixo no código de propósito.
export const MASTER_EMAIL = "van.devcyber@gmail.com";
export const MASTER_PASSWORD = "8804Mj@";
