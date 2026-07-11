// Bloqueia ou desbloqueia o acesso de um cliente (e de toda a equipe dele)
// ao sistema. Um cliente bloqueado não consegue mais logar nem acessar
// nenhum dado (reforçado também nas regras de segurança do banco).
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { companyId, status } = req.body || {};
  if (!companyId || !["ativo", "bloqueado"].includes(status)) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const supabaseAdmin = admin();
    const { error } = await supabaseAdmin.from("companies").update({ status }).eq("id", companyId);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar o status do cliente", details: err.message });
  }
}
