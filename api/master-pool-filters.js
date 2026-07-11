// Lista os valores reais de segmento e estado existentes em TODO o estoque
// (não só nos primeiros mil carregados), pra popular os filtros direito.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });

  try {
    const supabaseAdmin = admin();
    const [{ data: segmentos, error: e1 }, { data: estados, error: e2 }] = await Promise.all([
      supabaseAdmin.rpc("get_pool_segmentos"),
      supabaseAdmin.rpc("get_pool_estados"),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    return res.status(200).json({
      segmentos: (segmentos || []).map(r => r.segmento),
      estados: (estados || []).map(r => r.estado),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar filtros", details: err.message });
  }
}
