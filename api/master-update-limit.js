// Permite o Master definir quantos leads cada cliente pode ter (a cota).
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { companyId, leadsLimit } = req.body || {};
  if (!companyId || leadsLimit === undefined || leadsLimit === null || Number(leadsLimit) < 0) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const supabaseAdmin = admin();
    const { error } = await supabaseAdmin
      .from("companies")
      .update({ leads_limit: Number(leadsLimit) })
      .eq("id", companyId);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar o limite", details: err.message });
  }
}
