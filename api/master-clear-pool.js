// Apaga só os leads que ainda estão no estoque do Master (não distribuídos).
// Não mexe nos leads que já foram atribuídos a clientes.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const supabaseAdmin = admin();
    const { error } = await supabaseAdmin.from("leads").delete().is("company_id", null);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao limpar o estoque", details: err.message });
  }
}
