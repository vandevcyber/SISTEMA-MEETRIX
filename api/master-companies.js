// Lista os clientes (empresas) de verdade, com quantos leads cada um já tem
// e o tamanho do estoque (leads ainda não distribuídos, company_id = null).
// Usa a chave de serviço do Supabase porque a conta Master não passa pela
// autenticação normal — por isso as regras de segurança (RLS) não se aplicam
// a ela, e essa checagem precisa ficar só no servidor, nunca no navegador.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });

  try {
    const supabaseAdmin = admin();

    const { data: companies, error: companiesErr } = await supabaseAdmin
      .from("companies")
      .select("*")
      .order("created_at", { ascending: true });
    if (companiesErr) throw companiesErr;

    const withCounts = await Promise.all(
      (companies || []).map(async (c) => {
        const { count, error } = await supabaseAdmin
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("company_id", c.id);
        if (error) throw error;
        return {
          id: c.id,
          empresa: c.name,
          plano: c.plano,
          leadsLimite: c.leads_limit,
          leadsUsados: count || 0,
        };
      })
    );

    const { count: poolCount, error: poolErr } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("company_id", null);
    if (poolErr) throw poolErr;

    return res.status(200).json({ companies: withCounts, poolCount: poolCount || 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar clientes", details: err.message });
  }
}
