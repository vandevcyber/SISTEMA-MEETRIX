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
    bairro: l.bairro, funcionarios: l.funcionarios,
  };
  if (companyId) row.company_id = companyId;
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
  return row;
}

export function mapLeadFromDb(r) {
  return {
    id: r.id, empresa: r.empresa, nome: r.nome, cnpj: r.cnpj, email: r.email,
    tel1: r.tel1, tel2: r.tel2, socio: r.socio, cidade: r.cidade, estado: r.estado,
    divida: r.divida, dividaAtiva: r.divida_ativa, cnae: r.cnae, segmento: r.segmento,
    faturamento: r.faturamento, abertura: r.abertura, tributacao: r.tributacao,
    redeSocial: r.rede_social, etapa: r.etapa, status: r.status, responsavel: r.responsavel,
    respondeu: r.respondeu, reuniao: r.reuniao, obs: r.obs, valorNeg: r.valor_neg, produto: r.produto,
    bairro: r.bairro, funcionarios: r.funcionarios,
  };
}

/* ═══ MASTER: clientes reais, estoque de leads e distribuição ═══ */
// A conta Master não passa pela autenticação do Supabase, então essas ações
// passam por funções de servidor (pasta /api) que usam a chave de serviço.

export async function fetchMasterCompanies() {
  const r = await fetch("/api/master-companies");
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao buscar clientes");
  return data; // { companies: [...], poolCount: n }
}

export async function fetchMasterPoolLeads({ search = "", limit = 2000, offset = 0, segmento = "", estado = "" } = {}) {
  const params = new URLSearchParams({ search, limit: String(limit), offset: String(offset), segmento, estado });
  const r = await fetch(`/api/master-pool-leads?${params}`);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao buscar leads do estoque");
  return data.leads.map(mapLeadFromDb);
}

export async function fetchMasterPoolFilters() {
  const r = await fetch("/api/master-pool-filters");
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao buscar filtros do estoque");
  return data; // { segmentos: [...], estados: [...] }
}

export async function importMasterLeads(leadsArray, onProgress) {
  const BATCH = 300; // bem abaixo do limite de ~4.5MB por requisição da Vercel
  let totalInseridos = 0;
  for (let i = 0; i < leadsArray.length; i += BATCH) {
    const batch = leadsArray.slice(i, i + BATCH);
    const r = await fetch("/api/master-import-leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads: batch }),
    });
    let data;
    try {
      data = await r.json();
    } catch {
      throw new Error(`O servidor respondeu de um jeito inesperado (status ${r.status}). Tente importar um arquivo menor ou em partes.`);
    }
    if (!r.ok) throw new Error(data.error || "Erro ao importar leads");
    totalInseridos += data.inseridos;
    onProgress?.(totalInseridos, leadsArray.length);
  }
  return totalInseridos;
}

export async function distributeMasterLeads(leadIds, companyId) {
  const r = await fetch("/api/master-distribute-leads", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadIds, companyId }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao distribuir leads");
  return data.distribuidos;
}

export async function clearMasterPool() {
  const r = await fetch("/api/master-clear-pool", { method: "POST" });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao limpar o estoque");
}

export async function fetchPlatformLeadsTotal() {
  const { data, error } = await supabase.rpc("get_platform_leads_total");
  if (error) { console.error(error); return 0; }
  return data;
}

export async function toggleCompanyStatus(companyId, status, reason) {
  const r = await fetch("/api/master-toggle-company", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, status, reason }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao atualizar o status do cliente");
}

export async function deleteCompanyMaster(companyId) {
  const r = await fetch("/api/master-delete-company", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao excluir o cliente");
}

// Usado logo após o login do cliente, pra saber se a empresa está bloqueada (e por quê)
export async function fetchCompanyStatus(companyId) {
  const { data, error } = await supabase.from("companies").select("status, blocked_reason").eq("id", companyId).maybeSingle();
  if (error) { console.error(error); return { status: "ativo", reason: "" }; }
  return { status: data?.status || "ativo", reason: data?.blocked_reason || "" };
}

export async function updateCompanyLeadsLimit(companyId, leadsLimit) {
  const r = await fetch("/api/master-update-limit", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, leadsLimit }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao atualizar o limite");
}

export async function fetchMasterSupportMessages() {
  const r = await fetch("/api/master-support-messages");
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao buscar mensagens de suporte");
  return data.messages;
}

export async function replyMasterSupport(companyId, message) {
  const r = await fetch("/api/master-support-messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, message }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erro ao enviar resposta");
}

/* ═══ SUPORTE (CLIENTE) ═══ */
// Cada empresa só vê e envia mensagens da própria conversa (protegido por RLS).

export async function fetchCompanySupportMessages(companyId) {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

export async function sendSupportMessageDb({ companyId, senderEmail, message }) {
  const { error } = await supabase.from("support_messages").insert({
    company_id: companyId, sender_email: senderEmail, message, remetente: "cliente",
  });
  if (error) throw error;
}

export function subscribeToSupport(companyId, onMessage) {
  const sub = supabase
    .channel("support-" + companyId)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `company_id=eq.${companyId}` }, payload => onMessage(payload.new))
    .subscribe();
  return () => supabase.removeChannel(sub);
}

/* ═══ PINCELAB (planilha livre) ═══ */

export async function fetchPincelabSheet(companyId) {
  const { data, error } = await supabase.from("pincelab_sheets").select("*").eq("company_id", companyId).maybeSingle();
  if (error) { console.error(error); return null; }
  if (data) return data;
  // Primeira vez: cria a planilha já com 1000 linhas em branco
  const columns = ["Empresa", "Contato", "Telefone", "Email", "Status", "Observações"];
  const rows = Array.from({ length: 1000 }, () => columns.map(() => ""));
  const { data: created, error: createErr } = await supabase
    .from("pincelab_sheets")
    .insert({ company_id: companyId, columns, rows })
    .select()
    .single();
  if (createErr) { console.error(createErr); return null; }
  return created;
}

export async function savePincelabSheet(companyId, columns, rows, colWidths, styles) {
  const patch = { columns, rows, updated_at: new Date().toISOString() };
  if (colWidths !== undefined) patch.col_widths = colWidths;
  if (styles !== undefined) patch.styles = styles;
  const { error } = await supabase
    .from("pincelab_sheets")
    .update(patch)
    .eq("company_id", companyId);
  if (error) throw error;
}

export async function appendLeadsToPincelab(companyId, leadsArray) {
  const sheet = await fetchPincelabSheet(companyId);
  if (!sheet) throw new Error("Não foi possível abrir o PincelAb dessa empresa.");

  let cols = sheet.columns?.length ? [...sheet.columns] : [];
  const labelsPadrao = ["Empresa", "Contato", "Telefone", "Email", "Status"];
  while (cols.length < labelsPadrao.length) cols.push(labelsPadrao[cols.length]); // garante ao menos essas 5 colunas

  const rows = [...(sheet.rows || [])];
  const linhaFromLead = (l) => {
    const base = [l.empresa || l.nome || "", l.socio || l.nome || "", l.tel1 || "", l.email || "", l.status || ""];
    return cols.map((_, i) => base[i] || "");
  };

  let restantes = [...leadsArray];
  // Preenche primeiro nas linhas já existentes que estão totalmente vazias
  for (let i = 0; i < rows.length && restantes.length > 0; i++) {
    const vazia = !rows[i] || rows[i].every(c => !c);
    if (vazia) {
      rows[i] = linhaFromLead(restantes.shift());
    }
  }
  // O que sobrar (não coube nas vazias) vai em linhas novas no final
  restantes.forEach(l => rows.push(linhaFromLead(l)));

  await savePincelabSheet(companyId, cols, rows, sheet.col_widths, sheet.styles);
  return leadsArray.length;
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
