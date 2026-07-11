// Importa os leads do CSV do Master direto pro banco, no "estoque"
// (company_id = null). É isso que garante que os leads ficam salvos de
// verdade, mesmo a conta Master não passando pela autenticação do Supabase.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { leads } = req.body || {};
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: "Nenhum lead enviado" });
  }

  const rows = leads.map((l) => ({
    empresa: l.empresa, nome: l.nome, cnpj: l.cnpj, email: l.email,
    tel1: l.tel1, tel2: l.tel2, socio: l.socio, cidade: l.cidade, estado: l.estado,
    divida: l.divida, divida_ativa: l.dividaAtiva, cnae: l.cnae, segmento: l.segmento,
    faturamento: l.faturamento, abertura: l.abertura, tributacao: l.tributacao,
    rede_social: l.redeSocial, etapa: "novo", status: "Lead novo", company_id: null,
    bairro: l.bairro, funcionarios: l.funcionarios,
  }));

  try {
    const supabaseAdmin = admin();
    const BATCH = 1000;
    let inseridos = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabaseAdmin.from("leads").insert(batch);
      if (error) throw error;
      inseridos += batch.length;
    }
    return res.status(200).json({ inseridos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao importar leads", details: err.message });
  }
}
