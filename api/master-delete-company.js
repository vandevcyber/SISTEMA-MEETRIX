// Exclui um cliente por completo (a empresa e todos os logins da equipe dela).
// Antes de excluir, os leads que estavam com esse cliente voltam pro estoque
// do Master (company_id = null) — assim você não perde os leads, só o acesso
// do cliente é removido.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { companyId } = req.body || {};
  if (!companyId) return res.status(400).json({ error: "companyId é obrigatório" });

  try {
    const supabaseAdmin = admin();

    // 1) Devolve os leads desse cliente para o estoque
    const { error: leadsErr } = await supabaseAdmin
      .from("leads")
      .update({ company_id: null })
      .eq("company_id", companyId);
    if (leadsErr) throw leadsErr;

    // 2) Remove os logins de todos os colaboradores/admin dessa empresa (Supabase Auth)
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("company_id", companyId);
    if (profErr) throw profErr;

    for (const p of profiles || []) {
      await supabaseAdmin.auth.admin.deleteUser(p.id).catch(() => {}); // segue mesmo se algum já não existir
    }

    // 3) Exclui a empresa (profiles, chat_groups, chat_messages e support_messages
    // dessa empresa somem automaticamente, pois têm "on delete cascade")
    const { error: companyErr } = await supabaseAdmin.from("companies").delete().eq("id", companyId);
    if (companyErr) throw companyErr;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao excluir o cliente", details: err.message });
  }
}
