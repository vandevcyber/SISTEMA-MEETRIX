// Busca os leads que estão no "estoque" do Master (company_id = null),
// ou seja, os que ainda não foram atribuídos a nenhum cliente.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });

  const { search = "", limit = "2000", offset = "0" } = req.query;

  try {
    const supabaseAdmin = admin();
    let query = supabaseAdmin
      .from("leads")
      .select("*")
      .is("company_id", null)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (search) {
      const s = search.replace(/[%,]/g, "");
      query = query.or(`empresa.ilike.%${s}%,nome.ilike.%${s}%,cnpj.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ leads: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar leads do estoque", details: err.message });
  }
}
