// Atribui leads do estoque do Master (company_id = null) a um cliente
// específico (company_id = companyId). Só mexe em leads que ainda estão
// no estoque, pra nunca "roubar" leads que já são de outro cliente.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { leadIds, companyId } = req.body || {};
  if (!Array.isArray(leadIds) || leadIds.length === 0 || !companyId) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  try {
    const supabaseAdmin = admin();
    const { error, count } = await supabaseAdmin
      .from("leads")
      .update({ company_id: companyId, status: "Não contactado" })
      .in("id", leadIds)
      .is("company_id", null)
      .select("id", { count: "exact" });

    if (error) throw error;
    return res.status(200).json({ distribuidos: count ?? leadIds.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao distribuir leads", details: err.message });
  }
}
