// A conta Master não passa pela autenticação normal do Supabase, então ela
// usa esta função de servidor (com a chave de serviço) para ler as mensagens
// de suporte de TODAS as empresas e responder qualquer uma delas.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  const supabaseAdmin = admin();

  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("support_messages")
        .select("*, companies(name)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return res.status(200).json({ messages: data || [] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar mensagens", details: err.message });
    }
  }

  if (req.method === "POST") {
    const { companyId, message } = req.body || {};
    if (!companyId || !message?.trim()) {
      return res.status(400).json({ error: "Dados incompletos" });
    }
    try {
      const { error } = await supabaseAdmin.from("support_messages").insert({
        company_id: companyId,
        sender_email: "Meetrix (Suporte)",
        message: message.trim(),
        remetente: "master",
      });
      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao enviar resposta", details: err.message });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
