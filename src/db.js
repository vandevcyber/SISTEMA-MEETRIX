import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient.js";

/* ═══ PERFIL E EMPRESA ═══ */

// Depois do login, garante que o usuário tem um perfil e uma empresa.
// Se for o primeiro login dele (acabou de confirmar o cadastro), cria a empresa e o perfil como admin.
export async function ensureProfileAndCompany(user) {
  const { data: existing, error: fetchErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  // Primeiro acesso: cria a empresa e o perfil admin
  const empresaNome = user.user_metadata?.empresa || "Minha Empresa";

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .insert({ name: empresaNome, owner_id: user.id })
    .select()
    .single();

  if (companyErr) throw companyErr;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      company_id: company.id,
      nome: empresaNome,
      email: user.email,
      cargo: "admin",
    })
    .select()
    .single();

  if (profileErr) throw profileErr;
  return profile;
}

/* ═══ LEADS ═══ */

export async function fetchLeads(companyId) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(mapLeadFromDb);
}

export async function insertLeads(companyId, leadsArray) {
  const rows = leadsArray.map(l => mapLeadToDb(l, companyId));
  const { data, error } = await supabase.from("leads").insert(rows).select();
  if (error) { console.error(error); return []; }
  return data.map(mapLeadFromDb);
}

export async function updateLeadDb(id, patch) {
  const dbPatch = mapLeadToDb(patch);
  delete dbPatch.company_id;
  const { error } = await supabase.from("leads").update(dbPatch).eq("id", id);
  if (error) console.error(error);
}

export async function deleteLeadsDb(ids) {
  const { error } = await supabase.from("leads").delete().in("id", ids);
  if (error) console.error(error);
}

export async function clearAllLeadsDb(companyId) {
  const { error } = await supabase.from("leads").delete().eq("company_id", companyId);
  if (error) console.error(error);
}

function mapLeadToDb(l, companyId) {
  const row = {
    empresa: l.empresa, nome: l.nome, cnpj: l.cnpj, email: l.email,
    tel1: l.tel1, tel2: l.tel2, socio: l.socio, cidade: l.cidade, estado: l.estado,
    divida: l.divida, divida_ativa: l.dividaAtiva, cnae: l.cnae, segmento: l.segmento,
    faturamento: l.faturamento, abertura: l.abertura, tributacao: l.tributacao,
    rede_social: l.redeSocial, etapa: l.etapa, status: l.status, responsavel: l.responsavel,
    respondeu: l.respondeu, reuniao: l.reuniao, obs: l.obs, valor_neg: l.valorNeg || 0, produto: l.produto,
  };
  if (companyId) row.company_id = companyId;
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
  return row;
}

function mapLeadFromDb(r) {
  return {
    id: r.id, empresa: r.empresa, nome: r.nome, cnpj: r.cnpj, email: r.email,
    tel1: r.tel1, tel2: r.tel2, socio: r.socio, cidade: r.cidade, estado: r.estado,
    divida: r.divida, dividaAtiva: r.divida_ativa, cnae: r.cnae, segmento: r.segmento,
    faturamento: r.faturamento, abertura: r.abertura, tributacao: r.tributacao,
    redeSocial: r.rede_social, etapa: r.etapa, status: r.status, responsavel: r.responsavel,
    respondeu: r.respondeu, reuniao: r.reuniao, obs: r.obs, valorNeg: r.valor_neg, produto: r.produto,
  };
}

/* ═══ COLABORADORES (EQUIPE) ═══ */

export async function fetchCollabs(companyId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .neq("cargo", "admin")
    .order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data.map(p => ({ id: p.id, nome: p.nome, cargo: p.cargo, email: p.email, limite: p.limite_leads, status: "ativo" }));
}

// Cria login próprio para o colaborador, sem derrubar a sessão do Admin.
// Usa um client temporário separado só para esse cadastro.
export async function inviteCollaborator({ companyId, nome, email, cargo, limite, senhaTemporaria }) {
  const tempClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    { auth: { storageKey: "meetrix-invite-temp", persistSession: false } }
  );

  const { data, error } = await tempClient.auth.signUp({
    email,
    password: senhaTemporaria,
    options: { data: { nome, convite: true }, emailRedirectTo: window.location.origin },
  });

  if (error) throw error;

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: data.user.id,
    company_id: companyId,
    nome, email, cargo,
    limite_leads: limite,
  });

  if (profileErr) throw profileErr;

  return { id: data.user.id, nome, email, cargo, limite, status: "ativo" };
}

export async function removeCollaboratorDb(id) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) console.error(error);
}

/* ═══ ARQUIVOS (fotos, áudios) ═══ */

export async function uploadMedia(companyId, folder, file) {
  const ext = (file.name?.split(".").pop() || "bin").toLowerCase();
  const path = `${companyId}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateProfileFields(userId, patch) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

/* ═══ CHAT INTERNO ═══ */

export async function fetchGroups(companyId) {
  const { data, error } = await supabase.from("chat_groups").select("*").eq("company_id", companyId).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

export async function createGroupDb(companyId, nome) {
  const { data, error } = await supabase.from("chat_groups").insert({ company_id: companyId, nome, membros: [] }).select().single();
  if (error) throw error;
  return data;
}

export async function updateGroupMembersDb(id, membros) {
  const { error } = await supabase.from("chat_groups").update({ membros }).eq("id", id);
  if (error) console.error(error);
}

export async function fetchChatMessages(companyId, channelId) {
  const { data, error } = await supabase.from("chat_messages").select("*").eq("company_id", companyId).eq("channel_id", channelId).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

export async function sendChatMessage({ companyId, channelId, senderId, senderNome, tipo, conteudo }) {
  const { data, error } = await supabase.from("chat_messages")
    .insert({ company_id: companyId, channel_id: channelId, sender_id: senderId, sender_nome: senderNome, tipo, conteudo })
    .select().single();
  if (error) throw error;
  return data;
}

export function subscribeToChat(channelId, onMessage) {
  const sub = supabase
    .channel("chat-" + channelId)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` }, payload => onMessage(payload.new))
    .subscribe();
  return () => supabase.removeChannel(sub);
}

/* ═══ LOG DE EXPORTAÇÃO (proteção contra revenda de leads) ═══ */

export async function logExport({ companyId, empresaNome, userEmail, quantidade, valor, codigo, paymentId }) {
  const { error } = await supabase.from("export_logs").insert({
    company_id: companyId, empresa_nome: empresaNome, user_email: userEmail,
    quantidade, valor, codigo, payment_id: paymentId,
  });
  if (error) console.error(error);
}

export async function fetchExportLogs() {
  const { data, error } = await supabase.from("export_logs").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}
