import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { supabase, MASTER_EMAIL, MASTER_PASSWORD } from "./supabaseClient.js";
import { ensureProfileAndCompany, fetchLeads, fetchCollabs, insertLeads, updateLeadDb, deleteLeadsDb, clearAllLeadsDb, inviteCollaborator, removeCollaboratorDb, uploadMedia, updateProfileFields, fetchGroups, createGroupDb, updateGroupMembersDb, fetchChatMessages, sendChatMessage, subscribeToChat, logExport, fetchExportLogs, fetchMasterCompanies, fetchMasterPoolLeads, importMasterLeads, distributeMasterLeads, clearMasterPool, fetchPlatformLeadsTotal, updateCompanyLeadsLimit, fetchMasterSupportMessages, replyMasterSupport, fetchCompanySupportMessages, sendSupportMessageDb, subscribeToSupport, toggleCompanyStatus, deleteCompanyMaster, fetchCompanyStatus, fetchPincelabSheet, savePincelabSheet, appendLeadsToPincelab, fetchMasterPoolFilters } from "./db.js";
import { gerarCodigoExportacao, embutirMarcaDagua } from "./watermark.js";

const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAPnklEQVR42u1aeWxdZXY/5zvfXd7q5y22Y8dJnAUaTEhwVtphWIbpFGhRR7UqFVEmKU0gNFPoLAWpZammQEFMCgnV4LYBKaBIUKloyjYwGSbKMHQSYkgIGUJIyGbiOLbfdt997373W/pH3qOeTMh7dpIBpBzpydKT7/e+8zu/s94DcF7Oy3k5L+flvJyXz0mw/Dmv6OcFDJ7js83JX/b29lJraysPgoB830cAgGg0ahzHUYODg/L5559XtZ71RQXgNy67YsUKKwiCmOu6MWOMCwCW1po456i1RgAAxpiRUhrGmAKAEBFLpVKp4DhOoa+vLzyXQJwzBtx4441Jx3HqLcuKSSk5AAARVRQ9pRJaa+Sco1IKAQA45zIMw0IQBOlnn30290VmwKeWWbFiRZ1SqpmIImWlNBEZAICKYtVk7P8zxlj5ax8Ahvv6+rJnkw14tpRfvXq1I0SuTUqeJCJTUbxWpU8HRgUIpRRyLnO2nTy6du3a4GyAQGfD/Lfddlu9lLJTCB3lXsDTknMKQ65AfSbda5UwDEmVlJMXjKKlEguJ2wBQt2jRIvn2228Xz/TuZwzAqlWrWoUQk3WgWdbjka2mua7hWLbmsImzOJQ0MJJEOCEQhDCkfRnfV0g2OsOFqdvcVpUSUnMTGo06uXTpUty2bZv3uQFwyy23dAghmhljqlRgkWxWdv7Nr//3L1Yd2n57Uz6fWD+pZ++sIA2SUzheEIQwZHnFxOtmSur7u35+0+2H+m+flh1NvhttOkoWebaLgRAiuWDBAqu/vz83UXemicaNlStXtkspm2zbDnkQ8B2swb7mow8u/9bQ7ttRq+gFpUz39Mxxd33L/D2dImOIU4g1gmCEIZUTyU26o+Ghna9967r0x39OWkW7S5mLj2Jk75b2qXs7jaeY60opZXzx4sV8+/btEwKBTSTg3XrrrZOEEE22bYeVIIehIURj+YDaR6aLgPq69IFvPrTj5b/eoiY3lrKlOlVSvNoPqJLiIieSW3RrwyM7X/mr60c//rMSoC4iUz6gNmAsLZFVsoRt26EQomnZsmXN5YCI5woABACzfPnyhNa6ZazyY49DAMYA0ACgh6i/kTn0xz/c8eKtb8m2JpE3ydOBoEqKi7xJ/lK2Nj2689WVf5Q+eIOHqDUAIgDDU9y3AoJlWa3Lly9PjBeE8QBgent7iXPeLqWsmt4YAGoAzCFTX8sd+cZjO1++/VeiflIhp+pCP7ROpbyfN8mtYWPzmp0vrbomc+jaHDKlAZBVUUgphVJKwzlv7+3tpfGkRjYev08kEi1KKduyLF2VygDGBoMEhjLI1BX5gavX7nr527tUU0vRoySMBcEPrUJO1b0bNLY89t5Lq6/MDVyTQaYIDNlgUNWgkGVZWillJxKJlvHUOLUCYG6++WYXABoQUdVifQOoX6mbsUUghS4YGkWSX8kPXv74jv+54/0w0TZaoqT2Alt7gT1aouT7YX3bul0/vuMr+aNXpJFJBwwJJPlK3YwtBlHVwgJEVADQUL6rOVsAnAhyiM2IyCpl6ulEAxgHNL1RP/2dJ9oXrleAoQuajyCTS7yhy/5tx4vf2e9FOkY8q2GkGGnYW6zrWLfjxb9b6g39/ugJ5bkClD9qX7D+9cauftsYrmtQiIgMIjJEbK6VBaxG37c558larP//ICB0hln99PSeTT9qn78uRAoixvBhZLLHH174xHsvf++I584cGvBn9G197rsLSiOLRpDJCBgukQV97fPW9U1f+HqnyEldY0yrsIBznuzt7bVrYQGrxfqNjY0pYwzVYv2xD6atiH+RHBb/Pb37Z2unLFhTYuTHjOHDSHJeaXTeml0vrr7+T3u+3TR35vxC1pMRBB4gFdd19Pzr87Pnv9qjh3KGoT/e3sEYQ42NjalaWFANAFPu6BLjaWwMgLHAwDeHdl8zrJ3EHDFifjLtgi2PTl38qMe4lzCaDyFXc0vDF93w+gsXvfaXy/TxK7/Kg1AX1kxb8ugLMy/56VVqIO/FHI+B0WUtTK0sKDdjibE6TNgFVq9e7WitXa21Hof10Qc0iwrHFz6x86U79uj6+lmlLL45ddZbD09b8kiW7GydlpR2Iqr5F2/qy//9SfzFdTeM3HPxtY9vnjT1ra/gYF4kogWcYCOlT4i7evVq50xcAAEAcrlcZLz0r2SCNDJ1qT/cs27Xi987ICNNnaUs9k+ese2fp//Bv4xwZzSlJPl1daZjxw5c/ODDxQMQSSdJgSGjGVMT7iIrbpDL5SLV3KAqAxzHiUx0SEAANIqk5hbTc9ftfuX7xwKrtVVm8YPWye/+U9dXHzrG3eP1SlLGiagZItfxxN5X/rZ+NDdrV1ifwIKImPLIbKJSy91ZNf+XUtrjtT4CgATUITIVAU0jSHJOMTPnsd2v/n2uyNpTsogHJzXu+seZVz541IoebdCSRhmXk0O//YO9b9w17ZPj896Rk+JchK6ZaJd3YvxmV4sDVRnAOefjGWdVMGAAZmNT90vHyU2njOLDSHJ2kJv9ww9eu0sWZGdUhjjcWLfnrllXPXjYjh9u1IpnkMJWWWy9Z9/P71pw+ONF6dBJakBe1qDm3x8zU+RnwoBy/YOslqmOYsyQOUFZDWAs0LQvVn/gH2ZctXaYOyMpo/goUjgjyHc9suend1v5oIsAoFDv7vvu7Ksf3G/HDzQaZY0iiRmy2HzzQP/yfGhHmEEaY0LDALCW4MgYM4jIzjQNglIKhRBVUY9RqD1ycgAAHAxIQGiVBdHfPPWd+7ouf3iQR4ZSJxQMpwqv86EPN92dGsnO1mgZiFsHv3Ph1x/c4yQ/nGqk/RGPDa7v6PnPpB36gEbp8pkAgAXm5GIUVs1IQoiaWFttIIKXXnppo2VZdLosqIlMyi/yXyYm5xKery8qjl6CgPBmqn1TocH5MBuPD2512/b0ZAfmtiiRSiOFk5RILcoMzN/uTNo7lEgdj3KTe6NuyntTCunYf3TM27C1s+vtJCuJ9nR2ymXZI1fYAPjjhpnPbpx9yeu/h3kPopao0hyh1lr19/ePnlEhZIzRupZoHIXSHEynf9B9zcbnmi9cTwAQMRqz0aR/sZPJDbSldt49++oHDdvxQg1FWBimsEUWW+7bt/fumUODFw/bUR2PsoPLl/7JA4c7W7Yu5Me8QjTiOyCRI8JzzbOfvmfe15+dw7KjEIVSDbUAGmN0tUKo6khs0aJFSQBwjDGmms+BDeHsYto83TZ3b2PB8zzLGTrQ3PxxvROU2pWUh6Px3ObIlF/3ZI/MmSyDpjSSTGkZvyx9aOkAj793pK3xwGI15DtR5hsbpWcc1nV8pO2QFdv/QPfX/utadShn6rnHOa/qAoiIRFTavn17ZqIAIADAggULYkqpKOdcG2OwGgjSgXB6KW02tV34wWgsMjjVEUVyKdQuyUbhqRE7lv9JvGt3T+bIhe2y1AwAMGRHj/ysefobKuUMRmNYQpsrJDLJ0KcP3Yb0rzpmvrdQf1LQKasm5ctlOzHGvO3bt+dPFwirArBkyRJbSplkjFUF4NPo61LYrDwZdU2RXAwRy4+5lmxUvspbbuGFulm7Fo8empPhzuiq7ut/kG+KfzSFCkVwbfnpBQhVlGTQggXBknap1nqEMQZaa2bbdnrbtm3F0wHAqxVCYRgWLcvSUsra52yMGYg7gp3kk4wxI6JW2M787ACP7btnzpX3EQDEE+qTLp73ZNQJTz6HRVk43iJIKYWWZekwDIvVCqGqhUJbW1tpYGBAaK3tib7lsSxLW5YlgyCwotFoyWOe0+4XPK/Z/QgAYIprfGFHwCpbOAgCqoXqpwuAUkrR3t5eOuM0uHnzZtPd3e0SUayWOHAq5dPpdGxwcLDTdd3CkSNHprW3tx9jDpdxW4f1Cbt0YOhoRywW80qlUtT3fbejoyOTy+WciQBeaYTCMMw+/vjjVd8V8BoRzRBRw0QsYYzRYRhG0un0H2az2VFEZP39/V3lSM0Q0QghWrLZbJaIioyxwrFjx9y2tratkUjED8OQTQSEIAgyZ2MmaAAAnnnmmQIA+MYYmshllFIsFou909bWtgkR/TAMZyilWoQQs8IwrHcc5wAAFDnnx4UQDUEQzCai2uqP3y5cCAD88p2rDkRqYUDlFfSwUmoq5/y0k6GxWx+ccwyCwKqrq8vGYrH3E4lEjnP+hu/7Cdd1i8YYlFLaruvmtNbccRyZyWSORaPRLVprzhgrhWHIGGNm7LlVOkAkouGT7n76VFerLFu2rMuyrNhnDUfLGx7yxHt8jlJKYYwhy7KIiIQQwiEi4TgOSCnNiRUCMlprKj8vbdvWYRhyxpgSQjhaa8kY41prWXYZVsX3C0899dT+WnXi4wEglUodLRaLM06VEivKa62bETFUSpUQ8QIiygDAMSHEDMbYJ0qpKb7vZwGg0xizr1gsCsuy2hhjRWOM7XmeQsQCIjYR0WFE7AaAYUSURCSVUrlTgVAG3aRSqaPn7N3gmjVrigAwpJTipypKhBAKAJoQcRoRxRhjU7TWrVrrGGNskVIqyRhrZIwJxlgMAMB1XQUAljEGEbGbiFKc82bG2HytdawMlCaiyVrrKQAQnhwbynGGA8BQ+Y41M3u8QQYBwKxcuXKalDJZofsYKxjLslytta219hhjfMy+T5Ixlin7tACABACUyrS3wjBUiBhFRAEAZIxxOedpY0yTUipDRDYA0MkMKPs955znnnzyyQMwzrWZCS1IxONxb9KkSXFjjD22RGaModY6JKISAKAxRjLGNABopZRHREBE2hjDiKhS2mJ5PQ4AIOCca611aFlWQSlFSqm8ZVmglBKMsdLYO1f8nohKo6OjB3fv3j3+umEiABw8eFD39PTkyz2CNRYEPBEhCREBEdEYU/lQOU1hmRE0JnVh+S+rnCGlJESEMc8xrTWr9BUV5bXWASIe2LBhg5zo8HbCsmLFCkspNRUAoie7w7mUCu0BwCeigyctU8K5CoK/JX19fWFHR8d+IsqMXYY8l4qXJ9WciDIdHR37z0T5M2bAWLnpppsao9Foi5SSI6I6GzuCJ0V5NMYQ51z6vn9sw4YNI2fl7LMFwM6dO4tdXV1ZzjkBgGuMIUQ0RGQYYzDeJmrsc1prbowBrXUml8sd3rhxo3e27n02ffbT9HPnnXdG8vl8ozEmAQDW2B3hai6ilMKTdoZDRMwnEomRco6vqcT9PAD4rCCZIKI4YywihLA+q5QdkxG0bduh1rpYTp35M/XzzwuA37DSvffey3bv3u3U19fbYRja5T6gsu6mHceRABCm02kxZ86c4P7779efddaXTfCLytDfyQ9M4De/tJY+L+flvHz55P8Ajf2ieftD+90AAAAASUVORK5CYII=";
const LOGO_IMG = (size = 32, onDark = false) => ({width: size, height: size, objectFit: "contain", background: onDark ? "#fff" : "transparent", borderRadius: onDark ? 6 : (size > 40 ? 12 : 6), padding: onDark ? 3 : 0, boxSizing: "content-box"});



/* Dados agora são salvos no Supabase (banco real), não mais no navegador */

/* ═══ THEME ═══ */
const C = {
  bg: "#F4F5F9", white: "#FFFFFF", border: "#E2E5EB", text: "#1F2937", textSec: "#6B7280", textLight: "#9CA3AF",
  sidebar: "#2E1065", sidebarHover: "#3B0F8A", sidebarActive: "#5B21B6",
  accent: "#6D28D9", accentLight: "#EDE9FE",
  green: "#059669", greenLight: "#ECFDF5", orange: "#D97706", orangeLight: "#FEF3C7",
  red: "#DC2626", redLight: "#FEF2F2", blue: "#0369A1", blueLight: "#E0F2FE",
  yellow: "#CA8A04", yellowLight: "#FEF9C3", purple: "#7C3AED", purpleLight: "#F3E8FF",
};
const font = "Arial, Helvetica, sans-serif";

/* ═══ DATA ═══ */
const WHATSAPP_NUMBER = "5571992385455";
function linkWhatsAppPlano(nomePlano) {
  const msg = encodeURIComponent(`Olá! Tenho interesse no plano ${nomePlano} da Meetrix.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

const PLANS = [
  { id: "basic", name: "Basic", price: "R$ 2.000", leads: "30.000", benefits: ["30 mil leads mensais", "Gestão completa de leads", "Funil de vendas (Kanban)", "Distribuição para equipe", "Chat interno com fotos e áudio", "Assistência 24h", "Personalização por nicho"] },
  { id: "scale", name: "Scale", price: "R$ 3.000", leads: "70.000", benefits: ["70 mil leads mensais", "Todos os benefícios do Basic", "Relatórios e dashboard avançados", "Negociações com pipeline financeiro", "Suporte prioritário"] },
  { id: "growth", name: "Growth", price: "R$ 5.000", leads: "140.000", benefits: ["140 mil leads mensais", "Todos os benefícios do Scale", "Múltiplos colaboradores com permissões por cargo", "API de integração", "Gerente de conta dedicado"] },
  { id: "custom", name: "Personalizado", price: "Sob consulta", leads: "Sob consulta", benefits: ["Volume personalizado", "Todos os benefícios", "Integração sob medida", "SLA dedicado"] },
];

const FUNNEL = [
  { id: "novo", label: "Novo Lead", color: C.accent },
  { id: "contactado", label: "Contactado", color: C.blue },
  { id: "respondeu", label: "Respondeu", color: "#0891B2" },
  { id: "reunião", label: "Reunião Agendada", color: C.orange },
  { id: "negociação", label: "Em Negociação", color: C.purple },
  { id: "fechado", label: "Fechado/Ganho", color: C.green },
  { id: "perdido", label: "Perdido", color: C.red },
  { id: "sem_resposta", label: "Sem Resposta", color: C.textSec },
];

const LEAD_STATUS = ["Lead novo", "Contactado", "Aguardando resposta", "Sem resposta", "Reunião agendada", "Em negociação", "Lead convertido", "Sem interesse"];
const STATUS_COLORS = {
  "Em negociação": { bg: "#FEF3C7", color: "#D97706" },
  "Sem interesse": { bg: "#F3E8FF", color: "#7C3AED" },
  "Sem resposta": { bg: "#FEF2F2", color: "#DC2626" },
  "Aguardando resposta": { bg: "#FEF9C3", color: "#CA8A04" },
  "Contactado": { bg: "#E0F2FE", color: "#0369A1" },
  "Lead convertido": { bg: "#ECFDF5", color: "#059669" },
  "Lead novo": { bg: "#F3F4F6", color: "#6B7280" },
  "Reunião agendada": { bg: "#D1FAE5", color: "#065F46" },
  "Lead finalizado": { bg: "#ECFDF5", color: "#059669" },
  "Lead contactado": { bg: "#E0F2FE", color: "#0369A1" },
  "Proposta enviada": { bg: "#F3E8FF", color: "#7C3AED" },
};
const getStatusColor = (status) => STATUS_COLORS[status] || { bg: "#F3F4F6", color: "#6B7280" };
const ROLES = [
  { id: "admin", label: "Administrador" }, { id: "gestor", label: "Gestor" },
  { id: "sdr", label: "SDR" }, { id: "bdr", label: "BDR" }, { id: "closer", label: "Closer" },
];

const SAMPLE_LEADS = [];

const SAMPLE_COLLABS = [];


const NEWS_ITEMS = [
  { id: 1, fonte: "CNN Brasil", titulo: "Dolar fecha em alta e atinge R$ 5,72 com tensões comerciais", tempo: "2h", cat: "Economia" },
  { id: 2, fonte: "Globo", titulo: "Reforma tributária: novas regras para empresas do Simples", tempo: "4h", cat: "Tributação" },
  { id: 3, fonte: "Reuters", titulo: "Fed mantem juros e sinaliza corte para setembro", tempo: "6h", cat: "Internacional" },
  { id: 4, fonte: "Folha", titulo: "IPCA acumula 4,2% em 12 meses e pressiona Selic", tempo: "8h", cat: "Economia" },
  { id: 5, fonte: "Bloomberg", titulo: "Commodities: soja e milho sobem 3% na semana", tempo: "10h", cat: "Mercado" },
  { id: 6, fonte: "SBT News", titulo: "Governo anuncia linha de crédito de R$ 50 bi para PMEs", tempo: "12h", cat: "Negócios" },
];

const HELP_ITEMS = [
  { title: "Como importar leads via CSV", steps: ["Acesse o menu Leads", "Clique em 'Importar CSV'", "Arraste o arquivo ou clique para selecionar", "Confira os dados", "Clique em 'Confirmar'"] },
  { title: "Como distribuir leads para a equipe", steps: ["Selecione leads na tabela", "Clique em 'Distribuir'", "Escolha o colaborador", "Leads atribuídos automaticamente"] },
  { title: "Como usar o funil de vendas", steps: ["Acesse 'Funil de Vendas'", "Veja os cards por etapa", "Clique no card para detalhes", "Mova entre colunas pelo seletor"] },
  { title: "Como registrar negociações", steps: ["Acesse 'Negociações'", "Clique em '+ Nova Negociação'", "Preencha lead, closer, valor e produto", "Acompanhe status e datas"] },
  { title: "Como conectar o WhatsApp", steps: ["Acesse 'WhatsApp'", "Clique em 'Nova conexão'", "Escaneie o QR Code", "Pronto para mensagens"] },
];

/* ═══ UTILS ═══ */
const HEADER_MAP = {
  "empresa": "empresa", "razao social": "empresa", "razão social": "empresa", "nome fantasia": "empresa", "razao social/nome": "empresa",
  "nome": "nome", "contato": "nome", "responsavel": "nome",
  "cnpj": "cnpj",
  "email": "email", "e-mail": "email",
  "tel1": "tel1", "telefone": "tel1", "telefone 1": "tel1", "fone": "tel1", "celular": "tel1",
  "tel2": "tel2", "telefone 2": "tel2", "fone 2": "tel2",
  "socio": "socio", "sócio": "socio", "nome do socio": "socio", "nome do sócio": "socio",
  "cidade": "cidade",
  "bairro": "bairro",
  "estado": "estado", "uf": "estado",
  "divida": "divida", "dívida": "divida", "divida total": "divida", "dívida total": "divida",
  "dividaativa": "dividaAtiva", "divida ativa": "dividaAtiva", "dívida ativa": "dividaAtiva",
  "cnae": "cnae", "atividade": "cnae", "cnaes": "cnae", "segmento": "segmento", "nicho": "segmento",
  "faturamento": "faturamento", "faturamento medio": "faturamento", "faturamento médio": "faturamento",
  "funcionarios": "funcionarios", "funcionários": "funcionarios", "qtd funcionarios": "funcionarios", "qtd de funcionarios": "funcionarios", "numero de funcionarios": "funcionarios",
  "abertura": "abertura", "data de abertura": "abertura", "data abertura": "abertura",
  "tributacao": "tributacao", "tributação": "tributacao", "tipo de tributacao": "tributacao", "regime tributario": "tributacao", "regime tributário": "tributacao",
  "redesocial": "redeSocial", "rede social": "redeSocial", "instagram": "redeSocial", "linkedin": "redeSocial",
};

function normalizeHeader(h) {
  const clean = h.trim().toLowerCase().replace(/['"]/g, "").replace(/_/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  return HEADER_MAP[clean] || HEADER_MAP[h.trim().toLowerCase().replace(/['"]/g, "")] || clean;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => normalizeHeader(h));
  return lines.slice(1).map((line, i) => {
    const vals = []; let cur = "", inQ = false;
    for (const ch of line) { if (ch === '"') inQ = !inQ; else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; } else cur += ch; }
    vals.push(cur.trim());
    const obj = { id: Date.now() + i, etapa: "novo", status: "Lead novo", responsavel: "", respondeu: "", reunião: "", obs: "", valorNeg: 0, produto: "" };
    headers.forEach((h, j) => { if (vals[j]) obj[h] = vals[j].replace(/['"]/g, ""); });
    return obj;
  });
}

function fmt(v) { return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

/* ═══ STYLES ═══ */
const sCard = { background: C.white, borderRadius: 8, border: `1px solid ${C.border}` };
const sInput = { width: "100%", boxSizing: "border-box", padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: font, color: C.text, background: C.white, outline: "none" };
const sSelect = { ...sInput, cursor: "pointer" };
const sBtn = (bg = C.accent, color = "#fff") => ({ background: bg, color, border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font });
const sLabel = { fontSize: 10, fontWeight: 700, color: C.textSec, marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };

function Badge({ children, bg = C.accentLight, color = C.accent }) {
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>{children}</span>;
}

function MenuIcon({ id }) {
  const s = { width: 16, height: 16, flexShrink: 0 };
  const paths = {
    dashboard: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
    leads: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>,
    funil: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z"/></svg>,
    "negociações": <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 1 0 5H6"/></svg>,
    equipe: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="3"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><circle cx="17" cy="7" r="3"/><path d="M22 21v-2a5 5 0 0 0-3-4.6"/></svg>,
    whatsapp: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.5 8.5 0 0 1-11.8 7.8L3 21l1.7-6.2A8.5 8.5 0 1 1 21 11.5z"/></svg>,
    chat: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    "notícias": <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z"/><path d="M17 4h3v3h-3zM8 8h8M8 12h8M8 16h5"/></svg>,
    pincelab: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>,
    pagamentos: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    ajuda: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>,
    settings: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15 1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.48.5.87 1 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    master: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    sair: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>,
  };
  return paths[id] || <div style={s} />;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 10, padding: 24, width: wide ? 800 : 480, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textSec }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══ LANDING ═══ */
function LandingPage({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", fontFamily: font, fontSize: 12, color: C.text, background: C.white }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.sidebar, letterSpacing: 0.5 }}>MEETRIX</span>
          <span style={{ fontSize: 14, fontWeight: 400, color: C.textLight }}>|</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: 1, textTransform: "uppercase" }}>Smart Leads</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onLogin} style={sBtn(C.white, C.accent)}>Entrar</button>
          <button onClick={onLogin} style={sBtn()}>Criar conta</button>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: "80px 24px 60px", maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, color: C.sidebar }}>Gestão inteligente de leads para o setor comercial</h1>
        <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.6, marginBottom: 32 }}>Receba leads qualificados, distribua para sua equipe, acompanhe o funil de vendas e feche mais negócios. Tudo em uma única plataforma.</p>
        <button onClick={onLogin} style={{ ...sBtn(), padding: "14px 40px", fontSize: 15, borderRadius: 8 }}>Comece agora</button>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: 900, margin: "0 auto", padding: "0 24px 60px", justifyContent: "center" }}>
        {[["Leads qualificados", "Milhares de leads filtrados por segmento, cidade, CNPJ e faturamento."], ["Funil de vendas", "Acompanhe do primeiro contato ao fechamento com Kanban visual."], ["Negociações", "Controle valores, propostas e pipeline de receita em tempo real."], ["Gestão de equipe", "Distribua leads entre SDRs, BDRs e Closers com limites individuais."], ["WhatsApp integrado", "Fale com leads diretamente pela plataforma."], ["Notícias do mercado", "Dolar, Selic, tributação e notícias do Brasil e do mundo."]].map(([t, d], i) => (
          <div key={i} style={{ ...sCard, padding: 24, flex: "1 1 250px", maxWidth: 280 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: C.sidebar }}>{t}</div>
            <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.bg, padding: "50px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 28, color: C.sidebar }}>Planos</h2>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", maxWidth: 960, margin: "0 auto", justifyContent: "center" }}>
          {PLANS.map(p => (
            <div key={p.id} style={{ ...sCard, padding: 24, flex: "1 1 190px", maxWidth: 220, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, margin: "4px 0" }}>{p.price}</div>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 14 }}>{p.leads} leads/mes</div>
              {p.benefits.map((b, i) => <div key={i} style={{ fontSize: 11, padding: "3px 0", borderTop: i === 0 ? `1px solid ${C.border}` : "" }}>{b}</div>)}
              <a href={linkWhatsAppPlano(p.name)} target="_blank" rel="noopener noreferrer" style={{ ...sBtn(), width: "100%", marginTop: 14, display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>{p.id === "custom" ? "Fale conosco" : "Contratar"}</a>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "center", padding: "28px", color: C.textSec, fontSize: 11, borderTop: `1px solid ${C.border}` }}>meetrix - smart leads</div>
    </div>
  );
}

/* ═══ DASHBOARD ═══ */
function DashboardPage({ leads, collabs }) {
  const inNeg = leads.filter(l => l.etapa === "negociação");
  const fechados = leads.filter(l => l.etapa === "fechado");
  const totalNeg = inNeg.reduce((a, l) => a + (l.valorNeg || 0), 0);
  const totalFechado = fechados.reduce((a, l) => a + (l.valorNeg || 0), 0);
  const ticketMédio = fechados.length ? totalFechado / fechados.length : 0;
  const perdidos = leads.filter(l => l.etapa === "perdido").length;
  const txConversão = leads.length ? Math.round((fechados.length / leads.length) * 100) : 0;

  const receitaPorCloser = useMemo(() => {
    const map = {};
    fechados.forEach(l => { if (l.responsavel) map[l.responsavel] = (map[l.responsavel] || 0) + (l.valorNeg || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [fechados]);

  const maxReceita = receitaPorCloser.length ? receitaPorCloser[0][1] : 1;

  const porEtapa = FUNNEL.map(f => ({ ...f, count: leads.filter(l => l.etapa === f.id).length }));
  const porEstado = useMemo(() => {
    const map = {};
    leads.forEach(l => { if (l.estado) map[l.estado] = (map[l.estado] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Dashboard</h2>
      {/* KPI cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { t: "TOTAL EM NEGOCIACAO", v: fmt(totalNeg), sub: `${inNeg.length} neg. ativas`, c: C.accent, bc: C.accentLight },
          { t: "VENDAS FECHADAS NO MES", v: fmt(totalFechado), sub: `${fechados.length} fechamento${fechados.length !== 1 ? "s" : ""}`, c: C.green, bc: C.greenLight },
          { t: "TICKET MEDIO", v: fmt(ticketMédio), sub: "baseado em fechamentos", c: C.blue, bc: C.blueLight },
          { t: "NEGOCIACOES PENDENTES", v: inNeg.length, sub: "aguardando retorno", c: C.orange, bc: C.orangeLight },
          { t: "TX. CONVERSAO", v: `${txConversão}%`, sub: "do total", c: C.green, bc: C.greenLight },
          { t: "PERDIDOS", v: perdidos, sub: "este periodo", c: C.red, bc: C.redLight },
        ].map((s, i) => (
          <div key={i} style={{ ...sCard, padding: "16px 18px", flex: 1, minWidth: 140, borderLeft: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.t}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginTop: 2 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {/* Receita por closer */}
        <div style={{ ...sCard, padding: 18, flex: 2, minWidth: 300 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 14 }}>Receita por Closer</div>
          {receitaPorCloser.length === 0 && <div style={{ color: C.textLight, fontSize: 12 }}>Nenhum fechamento ainda</div>}
          {receitaPorCloser.map(([nome, val]) => (
            <div key={nome} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, width: 110, flexShrink: 0 }}>{nome}</span>
              <div style={{ flex: 1, background: C.bg, borderRadius: 4, height: 16, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(val / maxReceita) * 100}%`, background: C.green, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green, width: 100, textAlign: "right" }}>{fmt(val)}</span>
            </div>
          ))}
          {collabs.filter(c => !receitaPorCloser.find(r => r[0] === c.nome)).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, width: 110, flexShrink: 0, color: C.textLight }}>{c.nome}</span>
              <div style={{ flex: 1, background: C.bg, borderRadius: 4, height: 16 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.textLight, width: 100, textAlign: "right" }}>R$ 0,00</span>
            </div>
          ))}
        </div>

        {/* Funil por status */}
        <div style={{ ...sCard, padding: 18, flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 14 }}>Funil por Status</div>
          {porEtapa.filter(e => e.count > 0).map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, flex: 1 }}>{e.label}</span>
              <div style={{ width: 80, background: C.bg, borderRadius: 4, height: 12, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(e.count / leads.length) * 100}%`, background: e.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: e.color, width: 24, textAlign: "right" }}>{e.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição geográfica */}
      <div style={{ ...sCard, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 14 }}>Distribuição Geográfica</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {porEstado.map(([uf, count]) => (
            <div key={uf} style={{ ...sCard, padding: "12px 18px", textAlign: "center", minWidth: 80, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{uf}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{count}</div>
              <div style={{ fontSize: 10, color: C.textSec }}>{Math.round((count / leads.length) * 100)}% do total</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ NEGOTIATIONS PAGE ═══ */
function NegociaçõesPage({ leads, setLeads, collabs }) {
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ leadId: "", closer: "", produto: "", valor: 0, status: "Em Negociação", prioridade: "Média", dtReuniao: "", proxContato: "", comentário: "" });

  const negs = leads.filter(l => l.etapa === "negociação" || l.etapa === "fechado");
  const ativas = leads.filter(l => l.etapa === "negociação");
  const fechadas = leads.filter(l => l.etapa === "fechado");
  const totalNeg = ativas.reduce((a, l) => a + (l.valorNeg || 0), 0);
  const totalFechado = fechadas.reduce((a, l) => a + (l.valorNeg || 0), 0);
  const ticketMédio = fechadas.length ? totalFechado / fechadas.length : 0;

  const saveNew = () => {
    if (!newForm.leadId) return;
    const id = Number(newForm.leadId);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, etapa: "negociação", status: newForm.status, responsavel: newForm.closer, produto: newForm.produto, valorNeg: Number(newForm.valor), obs: newForm.comentário } : l));
    setShowNew(false);
    setNewForm({ leadId: "", closer: "", produto: "", valor: 0, status: "Em Negociação", prioridade: "Média", dtReuniao: "", proxContato: "", comentário: "" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Negociações Ativas ({ativas.length})</h2>
        <button onClick={() => setShowNew(true)} style={sBtn()}>+ Nova Negociação</button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { t: "TOTAL EM NEGOCIACAO", v: fmt(totalNeg), sub: `${ativas.length} ativas`, c: C.accent },
          { t: "VENDAS DO MES", v: fmt(totalFechado), sub: `${fechadas.length} fechamento${fechadas.length !== 1 ? "s" : ""}`, c: C.green },
          { t: "TICKET MEDIO", v: fmt(ticketMédio), sub: "média do mes", c: C.blue },
          { t: "NEGOC. PENDENTES", v: ativas.length, sub: "aguardando retorno", c: C.orange },
        ].map((s, i) => (
          <div key={i} style={{ ...sCard, padding: "16px 18px", flex: 1, minWidth: 150, borderTop: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.t}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...sCard, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {["Lead / Cliente", "Closer", "Produto/Serviço", "Valor", "Status", "Prioridade", "Observações"].map(h =>
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.textSec, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
              )}
            </tr></thead>
            <tbody>
              {negs.map(l => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{l.empresa || l.nome}</div>
                    <div style={{ fontSize: 10, color: C.textSec }}>{l.segmento} - {l.cidade}/{l.estado}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12 }}>{l.responsavel || "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12 }}>{l.produto || "—"}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: C.green }}>{fmt(l.valorNeg)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge bg={l.etapa === "fechado" ? C.greenLight : l.status === "Proposta enviada" ? C.purpleLight : C.orangeLight}
                      color={l.etapa === "fechado" ? C.green : l.status === "Proposta enviada" ? C.purple : C.orange}>
                      {l.etapa === "fechado" ? "Fechado" : l.status}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge bg={C.orangeLight} color={C.orange}>Média</Badge>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 11, color: C.textSec, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.obs || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {negs.length === 0 && <div style={{ padding: 32, textAlign: "center", color: C.textSec }}>Nenhuma negociação registrada.</div>}
        </div>
      </div>

      {/* New Negotiation Modal */}
      {showNew && (
        <Modal title="Nova Negociação" onClose={() => setShowNew(false)}>
          <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>Dados da negociação</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div><div style={sLabel}>Lead / Cliente *</div>
              <select value={newForm.leadId} onChange={e => setNewForm({ ...newForm, leadId: e.target.value })} style={sSelect}>
                <option value="">Selecione o lead...</option>
                {leads.filter(l => l.etapa !== "fechado" && l.etapa !== "negociação").map(l => <option key={l.id} value={l.id}>{l.empresa || l.nome}</option>)}
              </select>
            </div>
            <div><div style={sLabel}>Closer responsável</div>
              <select value={newForm.closer} onChange={e => setNewForm({ ...newForm, closer: e.target.value })} style={sSelect}>
                <option value="">Selecione...</option>
                {collabs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
            <div><div style={sLabel}>Produto / Serviço *</div><input value={newForm.produto} onChange={e => setNewForm({ ...newForm, produto: e.target.value })} placeholder="Ex: Pacote Scale - 50k leads" style={sInput} /></div>
            <div><div style={sLabel}>Valor da negociação (R$) *</div><input type="number" value={newForm.valor} onChange={e => setNewForm({ ...newForm, valor: e.target.value })} style={sInput} /></div>
            <div><div style={sLabel}>Status da negociação</div>
              <select value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value })} style={sSelect}>
                <option>Em Negociação</option><option>Proposta enviada</option><option>Aguardando resposta</option>
              </select>
            </div>
            <div><div style={sLabel}>Prioridade</div>
              <select value={newForm.prioridade} onChange={e => setNewForm({ ...newForm, prioridade: e.target.value })} style={sSelect}>
                <option>Alta</option><option>Média</option><option>Baixa</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>Datas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div><div style={sLabel}>Data reunião</div><input type="date" value={newForm.dtReuniao} onChange={e => setNewForm({ ...newForm, dtReuniao: e.target.value })} style={sInput} /></div>
            <div><div style={sLabel}>Próximo contato</div><input type="date" value={newForm.proxContato} onChange={e => setNewForm({ ...newForm, proxContato: e.target.value })} style={sInput} /></div>
            <div><div style={sLabel}>Previsão fechamento</div><input type="date" style={sInput} /></div>
          </div>
          <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>Acompanhamento</div>
          <div><div style={sLabel}>Comentários / Histórico</div><textarea value={newForm.comentário} onChange={e => setNewForm({ ...newForm, comentário: e.target.value })} rows={3} placeholder="Registro do andamento da negociação, objeções, condições..." style={{ ...sInput, resize: "vertical" }} /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button onClick={() => setShowNew(false)} style={sBtn(C.bg, C.text)}>Cancelar</button>
            <button onClick={saveNew} style={sBtn()}>Salvar Negociação</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══ LEADS PAGE ═══ */

function LeadsPage({ leads, setLeads, collabs, isMaster, companyId, empresaNome, userEmail, initialSearch, masterCompanies = [], onImportMaster, onDistributeMaster, onClearMaster, platformTotal = 0, realPoolTotal = 0 }) {
  const [importingMaster, setImportingMaster] = useState(false);
  const [distributingMaster, setDistributingMaster] = useState(false);
  const [search, setSearch] = useState(initialSearch || ""); const [fSeg, setFSeg] = useState(""); const [fUF, setFUF] = useState(""); const [fStatus, setFStatus] = useState("");
  const [selected, setSelected] = useState(new Set()); const [showImport, setShowImport] = useState(false); const [showDist, setShowDist] = useState(false); const [detail, setDetail] = useState(null); const [importResult, setImportResult] = useState(0);
  const fileRef = useRef();
  const [poolFilterOptions, setPoolFilterOptions] = useState({ segmentos: [], estados: [] });
  const [searchingPool, setSearchingPool] = useState(false);
  const searchDebounce = useRef(null);
  const poolLoadedOnce = useRef(false);

  useEffect(() => { if (initialSearch) setSearch(initialSearch); }, [initialSearch]);

  // Master: busca as opções reais de filtro (de todo o estoque, não só do que já foi carregado)
  useEffect(() => {
    if (!isMaster) return;
    fetchMasterPoolFilters().then(setPoolFilterOptions).catch(console.error);
  }, [isMaster]);

  // Master: o estoque pode ter centenas de milhares de leads — o Supabase só devolve até 1000
  // por consulta, então a busca por texto/segmento/estado é feita direto no servidor,
  // em vez de filtrar só os que já estão carregados no navegador.
  useEffect(() => {
    if (!isMaster) return;
    if (!poolLoadedOnce.current && !search && !fSeg && !fUF) { poolLoadedOnce.current = true; return; } // evita refazer a busca inicial que o App já fez
    setSearchingPool(true);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      try {
        const resultado = await fetchMasterPoolLeads({ search, segmento: fSeg, estado: fUF, limit: 500 });
        setLeads(resultado);
      } catch (e) { console.error(e); }
      setSearchingPool(false);
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [isMaster, search, fSeg, fUF]);

  const localSegs = useMemo(() => [...new Set(leads.map(l => l.segmento || l.cnae).filter(Boolean))].sort(), [leads]);
  const localUfs = useMemo(() => [...new Set(leads.map(l => l.estado).filter(Boolean))].sort(), [leads]);
  const segs = isMaster ? poolFilterOptions.segmentos : localSegs;
  const ufs = isMaster ? poolFilterOptions.estados : localUfs;

  const filtered = useMemo(() => leads.filter(l => {
    if (isMaster) return !fStatus || l.status === fStatus; // busca (texto/segmento/estado) já veio filtrada do servidor
    const q = search.toLowerCase();
    return (!q || [l.empresa, l.nome, l.cnpj, l.segmento, l.cnae, l.cidade].some(f => (f || "").toLowerCase().includes(q)))
      && (!fSeg || (l.segmento || l.cnae) === fSeg) && (!fUF || l.estado === fUF) && (!fStatus || l.status === fStatus);
  }), [leads, search, fSeg, fUF, fStatus, isMaster]);

  const [importProgress, setImportProgress] = useState(null); // { done, total }

  const handleCSV = f => {
    if (!f) return;
    const r = new FileReader();
    r.onload = async e => {
      const p = parseCSV(e.target.result);
      if (isMaster) {
        setImportingMaster(true);
        setImportProgress({ done: 0, total: p.length });
        try {
          const inseridos = await importMasterLeads(p, (done, total) => setImportProgress({ done, total }));
          setImportResult(inseridos);
          setShowImport(false);
          await onImportMaster?.(); // recarrega o estoque de leads real do banco
        } catch (err) {
          alert(err.message || "Erro ao importar leads. Confira se a chave de serviço do Supabase está configurada na Vercel.");
        }
        setImportingMaster(false);
        setImportProgress(null);
      } else {
        setLeads(prev => [...prev, ...p]);
        setImportResult(p.length);
        setShowImport(false);
      }
      setTimeout(() => setImportResult(0), 4000);
    };
    r.readAsText(f);
  };
  const toggleAll = () => { selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(l => l.id))); };
  const toggle = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const distribuir = nome => {
    const jaAtribuidos = leads.filter(l => selected.has(l.id) && l.responsavel && l.responsavel !== nome);
    const livres = leads.filter(l => selected.has(l.id) && (!l.responsavel || l.responsavel === nome));
    if (jaAtribuidos.length > 0) {
      const continuar = window.confirm(`${jaAtribuidos.length} dos leads selecionados já estão com outro colaborador e NÃO serão reatribuídos (um lead não pode ficar com duas pessoas ao mesmo tempo). Os outros ${livres.length} serão atribuídos a ${nome}. Continuar?`);
      if (!continuar) return;
    }
    setLeads(prev => prev.map(l => (selected.has(l.id) && (!l.responsavel || l.responsavel === nome)) ? { ...l, responsavel: nome, etapa: l.etapa === "novo" ? "contactado" : l.etapa, status: "Lead contactado" } : l));
    setSelected(new Set()); setShowDist(false);
  };
  // Master: atribui os leads selecionados (do estoque) a um cliente de verdade
  const distribuirParaCliente = async (companyIdDestino) => {
    setDistributingMaster(true);
    try {
      await distributeMasterLeads([...selected], companyIdDestino);
      setSelected(new Set());
      setShowDist(false);
      await onDistributeMaster?.(); // recarrega o estoque (os leads distribuídos somem da lista do Master)
    } catch (err) {
      alert(err.message || "Erro ao distribuir leads para o cliente.");
    }
    setDistributingMaster(false);
  };
  const updateLead = (id, data) => { setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l)); if (detail?.id === id) setDetail(prev => ({ ...prev, ...data })); };

  // Gera o CSV de fato, com marca d'água invisível, e registra o log de exportação
  const gerarEBaixarCSV = async (rows, valorPago = 0, paymentId = null) => {
    const codigo = gerarCodigoExportacao();
    const keys = ["empresa", "nome", "cnpj", "email", "tel1", "tel2", "socio", "cidade", "bairro", "estado", "segmento", "cnae", "faturamento", "funcionarios", "divida", "abertura", "tributacao", "status"];
    const csv = [keys.join(","), ...rows.map(r => keys.map((k, i) => {
      let val = r[k] || "";
      if (i === 0) val = embutirMarcaDagua(val, codigo); // marca d'água embutida no campo "empresa"
      return `"${val}"`;
    }).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "meetrix-leads.csv"; a.click();
    await logExport({ companyId, empresaNome, userEmail, quantidade: rows.length, valor: valorPago, codigo, paymentId });
  };

  // Exportação gratuita para todos (a cobrança por lead foi removida)
  const exportCSVGratis = () => {
    const rows = filtered.filter(l => selected.size === 0 || selected.has(l.id));
    gerarEBaixarCSV(rows, 0, null);
  };

  const limparTodosLeads = async () => {
    if (!window.confirm(`Tem certeza que deseja apagar TODOS os ${leads.length} leads do estoque? Essa ação não pode ser desfeita. (Leads já distribuídos a clientes não são afetados.)`)) return;
    if (isMaster) {
      try {
        await clearMasterPool();
        await onClearMaster?.();
      } catch (err) {
        alert(err.message || "Erro ao limpar o estoque.");
      }
    } else {
      await clearAllLeadsDb(companyId);
      setLeads([]);
    }
  };

  const rowsSelecionadas = filtered.filter(l => selected.size === 0 || selected.has(l.id));

  const exportCSV = exportCSVGratis;

  const [sendingToPincelab, setSendingToPincelab] = useState(false);
  const enviarParaPincelab = async () => {
    setSendingToPincelab(true);
    try {
      const leadsSelecionados = leads.filter(l => selected.has(l.id));
      await appendLeadsToPincelab(companyId, leadsSelecionados);
      alert(`${leadsSelecionados.length} leads enviados para o PincelAb!`);
      setSelected(new Set());
    } catch (e) {
      alert(e.message || "Erro ao enviar para o PincelAb.");
    }
    setSendingToPincelab(false);
  };


  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{isMaster ? `Estoque de leads` : `Leads (${leads.length})`}</h2>
          {isMaster && <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{searchingPool ? "Buscando..." : (search || fSeg || fUF) ? `${leads.length.toLocaleString("pt-BR")} resultados encontrados (mostrando até 500)` : `Mostrando ${leads.length.toLocaleString("pt-BR")} de ${realPoolTotal.toLocaleString("pt-BR")} no estoque total — use a busca ou os filtros pra encontrar leads específicos`}</div>}
          {!isMaster && platformTotal > 0 && <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>Leads na plataforma: <strong>{platformTotal.toLocaleString("pt-BR")}</strong> • você tem <strong>{leads.length.toLocaleString("pt-BR")}</strong> disponíveis</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isMaster && <button onClick={() => setShowImport(true)} style={sBtn()}>Importar CSV</button>}
          <button onClick={exportCSV} style={sBtn(C.green)}>Exportar CSV</button>
          {isMaster && leads.length > 0 && <button onClick={limparTodosLeads} style={sBtn(C.red)}>Limpar todos os leads</button>}
        </div>
      </div>
      {importResult > 0 && <div style={{ background: C.greenLight, border: `1px solid ${C.green}`, borderRadius: 6, padding: "10px 16px", marginBottom: 14, fontSize: 12, color: C.green, fontWeight: 600 }}>{importResult} leads importados com sucesso.</div>}
      {importingMaster && <div style={{ background: C.accentLight, border: `1px solid ${C.accent}`, borderRadius: 6, padding: "10px 16px", marginBottom: 14, fontSize: 12, color: C.accent, fontWeight: 600 }}>
        Importando e salvando os leads no banco, aguarde{importProgress ? ` (${importProgress.done.toLocaleString("pt-BR")} de ${importProgress.total.toLocaleString("pt-BR")})` : "..."}
        {importProgress && importProgress.total > 0 && <div style={{ background: "#fff", borderRadius: 4, height: 6, marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.round((importProgress.done / importProgress.total) * 100)}%`, background: C.accent, transition: "width .2s" }} /></div>}
      </div>}

      <div style={{ ...sCard, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa, CNPJ, nome, segmento..." style={{ ...sInput, flex: 2, minWidth: 180 }} />
          <select value={fSeg} onChange={e => setFSeg(e.target.value)} style={{ ...sSelect, flex: 1, minWidth: 120 }}><option value="">Segmento</option>{segs.map(s => <option key={s}>{s}</option>)}</select>
          <select value={fUF} onChange={e => setFUF(e.target.value)} style={{ ...sSelect, width: 70 }}><option value="">UF</option>{ufs.map(s => <option key={s}>{s}</option>)}</select>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ ...sSelect, flex: 1, minWidth: 130 }}><option value="">Status</option>{LEAD_STATUS.map(s => <option key={s}>{s}</option>)}</select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: C.textSec }}>{filtered.length} leads</span>
        <span style={{ flex: 1 }} />
        {selected.size > 0 && <><span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{selected.size} selecionados</span><button onClick={() => setShowDist(true)} style={sBtn()}>Distribuir</button>{!isMaster && <button onClick={enviarParaPincelab} disabled={sendingToPincelab} style={sBtn(C.blueLight, C.blue)}>{sendingToPincelab ? "Enviando..." : "Enviar p/ PincelAb"}</button>}</>}
      </div>

      <div style={{ ...sCard, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1800 }}>
            <thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: "10px 12px", width: 32 }}><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              {["CNPJ", "Razão Social/Nome", "Nome do Sócio", "Dívida Ativa", "Dívida Total", "Segmento", "CNAE(s)", "Cidade", "Bairro", "Estado", "Telefone", "Telefone 2", "E-mail", "Faturamento", "Funcionários", "Regime Tributário", "Rede Social", "Status", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.textSec, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.slice(0, 100).map(l => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px" }}><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} /></td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{l.cnpj || "—"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, minWidth: 140 }}>{l.empresa || l.nome}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11 }}>{l.socio || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.textSec }}>{l.dividaAtiva || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: l.divida && l.divida !== "R$ 0,00" ? C.red : C.green, fontWeight: 600 }}>{l.divida || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11 }}>{l.segmento || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, whiteSpace: "nowrap" }}>{l.cnae || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11 }}>{l.cidade || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11 }}>{l.bairro || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11 }}>{l.estado || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, whiteSpace: "nowrap" }}>{l.tel1 || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, whiteSpace: "nowrap" }}>{l.tel2 || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11 }}>{l.email || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, whiteSpace: "nowrap" }}>{l.faturamento || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, whiteSpace: "nowrap" }}>{l.funcionarios || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, whiteSpace: "nowrap" }}>{l.tributacao || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.accent }}>{l.redeSocial || "—"}</td>
                  <td style={{ padding: "10px 12px" }}><Badge bg={getStatusColor(l.status).bg} color={getStatusColor(l.status).color}>{l.status}</Badge></td>
                  <td style={{ padding: "10px 12px" }}><button onClick={() => setDetail(l)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: font }}>Abrir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && <Modal title="Importar leads via CSV" onClose={() => setShowImport(false)}>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleCSV(e.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: 40, textAlign: "center", cursor: "pointer", background: C.bg }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleCSV(e.target.files[0])} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Arraste o CSV aqui ou clique para selecionar</div>
          <div style={{ fontSize: 10, color: C.textSec }}>Colunas: nome, tel1, tel2, email, socio, cnpj, cidade, bairro, estado, divida, cnae(s), faturamento, funcionarios, abertura, regime tributário, empresa, segmento</div>
        </div>
      </Modal>}
      {showDist && isMaster && <Modal title="Distribuir leads" onClose={() => setShowDist(false)}>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 14 }}>{selected.size} leads serão atribuídos ao cliente selecionado. Eles saem do estoque e passam a pertencer só a esse cliente.</div>
        {distributingMaster && <div style={{ fontSize: 12, color: C.accent, marginBottom: 10 }}>Distribuindo...</div>}
        {masterCompanies.length === 0 && <div style={{ fontSize: 12, color: C.textSec }}>Nenhum cliente cadastrado ainda. Assim que alguém criar conta como cliente, ele aparece aqui.</div>}
        {masterCompanies.map(c => <button key={c.id} disabled={distributingMaster} onClick={() => distribuirParaCliente(c.id)} style={{ ...sCard, padding: "12px 16px", width: "100%", cursor: distributingMaster ? "default" : "pointer", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", opacity: distributingMaster ? 0.6 : 1 }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.empresa}</div><div style={{ fontSize: 11, color: C.textSec }}>{c.leadsUsados} leads atribuídos • {PLANS.find(p => p.id === c.plano)?.name || c.plano}</div></div><span style={{ color: C.accent, fontWeight: 600, fontSize: 12 }}>Atribuir</span></button>)}
      </Modal>}
      {showDist && !isMaster && <Modal title="Distribuir leads" onClose={() => setShowDist(false)}>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 14 }}>{selected.size} leads serao atribuídos ao colaborador selecionado.</div>
        {collabs.map(c => <button key={c.id} onClick={() => distribuir(c.nome)} style={{ ...sCard, padding: "12px 16px", width: "100%", cursor: "pointer", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome}</div><div style={{ fontSize: 11, color: C.textSec }}>{ROLES.find(r => r.id === c.cargo)?.label}</div></div><span style={{ color: C.accent, fontWeight: 600, fontSize: 12 }}>Atribuir</span></button>)}
      </Modal>}
      {detail && <Modal title={detail.empresa || detail.nome} onClose={() => setDetail(null)} wide>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Nome", detail.nome], ["Email", detail.email], ["Telefone 1", detail.tel1], ["Telefone 2", detail.tel2], ["Socio", detail.socio], ["CNPJ", detail.cnpj], ["Cidade", detail.cidade], ["Bairro", detail.bairro], ["Estado", detail.estado], ["Divida", detail.divida], ["CNAE(s)", detail.cnae], ["Faturamento", detail.faturamento], ["Qtd. funcionários", detail.funcionarios], ["Abertura", detail.abertura], ["Regime tributário", detail.tributacao], ["Segmento", detail.segmento]].map(([k, v]) => <div key={k}><div style={sLabel}>{k}</div><div style={{ fontSize: 12 }}>{v || "—"}</div></div>)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ marginBottom: 12 }}><div style={sLabel}>Etapa do funil</div><select value={detail.etapa} onChange={e => updateLead(detail.id, { etapa: e.target.value })} style={sSelect}>{FUNNEL.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
            <div style={{ marginBottom: 12 }}><div style={sLabel}>Status</div><select value={detail.status} onChange={e => updateLead(detail.id, { status: e.target.value })} style={sSelect}>{LEAD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><div style={sLabel}>Respondeu?</div><select value={detail.respondeu} onChange={e => updateLead(detail.id, { respondeu: e.target.value })} style={sSelect}><option value="">—</option><option value="sim">Sim</option><option value="nao">Nao</option></select></div>
              <div><div style={sLabel}>Reunião?</div><select value={detail.reunião} onChange={e => updateLead(detail.id, { reunião: e.target.value })} style={sSelect}><option value="">—</option><option value="sim">Sim</option><option value="nao">Nao</option></select></div>
            </div>
            <div style={{ marginBottom: 12 }}><div style={sLabel}>Responsável</div><select value={detail.responsavel} onChange={e => updateLead(detail.id, { responsavel: e.target.value })} style={sSelect}><option value="">Não atribuído</option>{collabs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
            <div style={{ marginBottom: 12 }}><div style={sLabel}>Valor negociação (R$)</div><input type="number" value={detail.valorNeg || 0} onChange={e => updateLead(detail.id, { valorNeg: Number(e.target.value) })} style={sInput} /></div>
            <div><div style={sLabel}>Observações</div><textarea value={detail.obs} onChange={e => updateLead(detail.id, { obs: e.target.value })} rows={3} style={{ ...sInput, resize: "vertical" }} /></div>
          </div>
        </div>
      </Modal>}
    </div>
  );
}

/* ═══ FUNNEL KANBAN ═══ */
function FunnelPage({ leads, setLeads, collabs }) {
  const inNeg = leads.filter(l => l.etapa === "negociação");
  const fechados = leads.filter(l => l.etapa === "fechado");
  const totalNeg = inNeg.reduce((a, l) => a + (l.valorNeg || 0), 0);
  const totalFechado = fechados.reduce((a, l) => a + (l.valorNeg || 0), 0);
  const updateLead = (id, data) => setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  const [showNeg, setShowNeg] = useState(false);
  const [negForm, setNegForm] = useState({ leadId: "", closer: "", produto: "", valor: 0 });
  const [showDist, setShowDist] = useState(false);
  const [distLeadId, setDistLeadId] = useState(null);

  const saveNeg = () => { if (!negForm.leadId) return; setLeads(prev => prev.map(l => l.id === Number(negForm.leadId) ? { ...l, etapa: "negociação", status: "Em negociação", responsavel: negForm.closer, produto: negForm.produto, valorNeg: Number(negForm.valor) } : l)); setShowNeg(false); setNegForm({ leadId: "", closer: "", produto: "", valor: 0 }); };
  const distribuirLead = (leadId, nome) => { setLeads(prev => prev.map(l => l.id === leadId ? { ...l, responsavel: nome } : l)); setShowDist(false); setDistLeadId(null); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Funil de Vendas</h2>
        <button onClick={() => setShowNeg(true)} style={sBtn()}>+ Nova Negociação</button>
      </div>
      {/* Financial KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { t: "TOTAL EM NEGOCIACAO", v: fmt(totalNeg), sub: `${inNeg.length} neg. ativas`, c: C.accent },
          { t: "VENDAS FECHADAS", v: fmt(totalFechado), sub: `${fechados.length} contratos`, c: C.green },
          { t: "TICKET MEDIO", v: fmt(fechados.length ? totalFechado / fechados.length : 0), sub: "por contrato", c: C.blue },
          { t: "TX. CONVERSAO", v: `${leads.length ? Math.round((fechados.length / leads.length) * 100) : 0}%`, sub: "do total captado", c: C.green },
        ].map((s, i) => (
          <div key={i} style={{ ...sCard, padding: "14px 18px", flex: 1, minWidth: 150, borderTop: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: "uppercase" }}>{s.t}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginTop: 2 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: C.textSec }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Funnel visual bar */}
      <div style={{ ...sCard, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 12 }}>Estágios do Funil</div>
        {FUNNEL.map(f => {
          const count = leads.filter(l => l.etapa === f.id).length;
          const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
          return (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 3, height: 22, background: f.color, borderRadius: 2 }} />
              <div style={{ flex: 1, background: C.bg, borderRadius: 4, height: 22, overflow: "hidden", position: "relative" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: f.color + "25", borderRadius: 4 }} />
                <div style={{ position: "absolute", top: 0, left: 8, right: 8, lineHeight: "22px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: f.color }}>{f.label}</span>
                  <span style={{ fontSize: 10, color: C.textSec }}>{pct}%</span>
                </div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: f.color, width: 28, textAlign: "right" }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
        {FUNNEL.map(stage => {
          const items = leads.filter(l => l.etapa === stage.id);
          return (
            <div key={stage.id} style={{ minWidth: 165, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "6px 10px", background: stage.color + "14", borderRadius: 6, borderLeft: `3px solid ${stage.color}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.white, background: stage.color, borderRadius: 10, padding: "1px 7px" }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 60 }}>
                {items.map(l => (
                  <div key={l.id} style={{ ...sCard, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{l.empresa || l.nome}</div>
                    <div style={{ fontSize: 10, color: C.textSec }}>{l.segmento} - {l.cidade}/{l.estado}</div>
                    {l.responsavel ? <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, marginTop: 3 }}>{l.responsavel}</div>
                      : <button onClick={() => { setDistLeadId(l.id); setShowDist(true); }} style={{ ...sBtn(C.blueLight, C.blue), padding: "2px 8px", fontSize: 9, marginTop: 3, width: "100%" }}>Distribuir</button>}
                    {l.valorNeg > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: C.green, marginTop: 2 }}>{fmt(l.valorNeg)}</div>}
                    <select value={l.etapa} onChange={e => updateLead(l.id, { etapa: e.target.value })} style={{ ...sSelect, padding: "3px 6px", fontSize: 10, marginTop: 4 }}>
                      {FUNNEL.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                ))}
                {items.length === 0 && <div style={{ fontSize: 10, color: C.textLight, textAlign: "center", padding: 16, background: C.bg, borderRadius: 6 }}>Vazio</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Negotiation Modal */}
      {showNeg && <Modal title="Registrar Negociação" onClose={() => setShowNeg(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={sLabel}>Lead / Cliente *</div><select value={negForm.leadId} onChange={e => setNegForm({...negForm, leadId: e.target.value})} style={sSelect}><option value="">Selecione...</option>{leads.filter(l => l.etapa !== "fechado" && l.etapa !== "negociação").map(l => <option key={l.id} value={l.id}>{l.empresa || l.nome}</option>)}</select></div>
          <div><div style={sLabel}>Closer responsável</div><select value={negForm.closer} onChange={e => setNegForm({...negForm, closer: e.target.value})} style={sSelect}><option value="">Selecione...</option>{collabs.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
          <div><div style={sLabel}>Produto / Serviço</div><input value={negForm.produto} onChange={e => setNegForm({...negForm, produto: e.target.value})} placeholder="Ex: Pacote Scale - 50k leads" style={sInput} /></div>
          <div><div style={sLabel}>Valor (R$)</div><input type="number" value={negForm.valor} onChange={e => setNegForm({...negForm, valor: e.target.value})} style={sInput} /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button onClick={() => setShowNeg(false)} style={sBtn(C.bg, C.text)}>Cancelar</button><button onClick={saveNeg} style={sBtn()}>Salvar</button></div>
        </div>
      </Modal>}

      {/* Distribution Modal */}
      {showDist && distLeadId && <Modal title="Distribuir lead" onClose={() => { setShowDist(false); setDistLeadId(null); }}>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 14 }}>Selecione o colaborador responsável:</div>
        {collabs.map(c => <button key={c.id} onClick={() => distribuirLead(distLeadId, c.nome)} style={{ ...sCard, padding: "12px 16px", width: "100%", cursor: "pointer", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome}</div><div style={{ fontSize: 11, color: C.textSec }}>{ROLES.find(r => r.id === c.cargo)?.label}</div></div><span style={{ color: C.accent, fontWeight: 600, fontSize: 12 }}>Atribuir</span></button>)}
      </Modal>}
    </div>
  );
}

/* ═══ REMAINING PAGES (Team, WhatsApp, Chat, News, Payments, Help, Settings, Master, Support) ═══ */
function TeamPage({ collabs, setCollabs, leads, companyId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nome: "", cargo: "sdr", email: "", limite: 500, senha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const add = async () => {
    setError("");
    if (!form.nome || !form.email || form.senha.length < 6) { setError("Preencha nome, email e uma senha de ao menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const novo = await inviteCollaborator({ companyId, nome: form.nome, email: form.email, cargo: form.cargo, limite: form.limite, senhaTemporaria: form.senha });
      setCollabs(prev => [...prev, novo]);
      setForm({ nome: "", cargo: "sdr", email: "", limite: 500, senha: "" });
      setShowAdd(false);
    } catch (e) {
      setError(e.message || "Erro ao convidar colaborador.");
    }
    setLoading(false);
  };

  const remove = async (id) => {
    await removeCollaboratorDb(id);
    setCollabs(prev => prev.filter(x => x.id !== id));
  };

  return (<div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Equipe</h2><button onClick={() => setShowAdd(true)} style={sBtn()}>+ Novo colaborador</button></div>
    {collabs.map(c => { const assigned = leads.filter(l => l.responsavel === c.nome).length; const contactados = leads.filter(l => l.responsavel === c.nome && l.status !== "Lead novo").length; const fechados = leads.filter(l => l.responsavel === c.nome && l.etapa === "fechado").length;
      return (<div key={c.id} style={{ ...sCard, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><div style={{ fontWeight: 700, fontSize: 14 }}>{c.nome}</div><div style={{ fontSize: 11, color: C.textSec }}>{ROLES.find(r => r.id === c.cargo)?.label} | {c.email}</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{assigned}</div><div style={{ fontSize: 10, color: C.textSec }}>leads</div></div><div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{contactados}</div><div style={{ fontSize: 10, color: C.textSec }}>contactados</div></div><div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{fechados}</div><div style={{ fontSize: 10, color: C.textSec }}>fechados</div></div><div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{c.limite}</div><div style={{ fontSize: 10, color: C.textSec }}>limite</div></div><Badge bg={C.greenLight} color={C.green}>Ativo</Badge><button onClick={() => remove(c.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: font }}>Remover</button></div></div>);
    })}
    {collabs.length === 0 && <div style={{ ...sCard, padding: 32, textAlign: "center", color: C.textLight, fontSize: 12 }}>Nenhum colaborador cadastrado ainda.</div>}
    {showAdd && <Modal title="Novo colaborador" onClose={() => setShowAdd(false)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {error && <div style={{ background: C.redLight, color: C.red, padding: "8px 12px", borderRadius: 6, fontSize: 12 }}>{error}</div>}
        <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5 }}>O colaborador recebe um login próprio. Ele vai precisar confirmar o email (clicando no link recebido) antes de conseguir entrar.</div>
        <div><div style={sLabel}>Nome</div><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={sInput} /></div>
        <div><div style={sLabel}>Cargo</div><select value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} style={sSelect}>{ROLES.filter(r => r.id !== "admin").map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
        <div><div style={sLabel}>Email</div><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={sInput} /></div>
        <div><div style={sLabel}>Senha temporária (o colaborador pode trocar depois)</div><input type="text" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} style={sInput} placeholder="Mínimo 6 caracteres" /></div>
        <div><div style={sLabel}>Limite de leads</div><input type="number" value={form.limite} onChange={e => setForm({ ...form, limite: Number(e.target.value) })} style={sInput} /></div>
        <button onClick={add} disabled={loading} style={{ ...sBtn(), opacity: loading ? 0.6 : 1 }}>{loading ? "Criando acesso..." : "Cadastrar e criar login"}</button>
      </div>
    </Modal>}
  </div>);
}

function WhatsAppPage() {
  const [instances, setInstances] = useState([]);
  const [showConnect, setShowConnect] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [newInst, setNewInst] = useState({ nome: "", responsável: "" });
  const [active, setActive] = useState(null);
  const [txt, setTxt] = useState("");
  const [chatMsgs, setChatMsgs] = useState([]);

  const convs = [];

  const startScan = () => { setScanning(true); setTimeout(() => { setScanning(false); setScanDone(true); }, 3000); };
  const finishConnect = () => {
    if (!newInst.nome) return;
    setInstances(prev => [...prev, { id: Date.now(), nome: newInst.nome, número: "(00) 00000-0000", status: "conectado", responsável: newInst.responsável }]);
    setShowConnect(false); setScanDone(false); setNewInst({ nome: "", responsável: "" });
  };

  const selectConv = (c) => {
    setActive(c);
    setChatMsgs([
      { id: 1, from: "lead", text: c.msg, time: c.time },
    ]);
  };

  const sendMsg = () => {
    if (!txt.trim()) return;
    setChatMsgs(prev => [...prev, { id: Date.now(), from: "user", text: txt, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
    setTxt("");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>WhatsApp</h2>
        <button onClick={() => { setShowConnect(true); setScanDone(false); setScanning(false); }} style={sBtn()}>+ Nova conexão</button>
      </div>

      {/* Instances */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {instances.map(inst => (
          <div key={inst.id} style={{ ...sCard, padding: "14px 18px", flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{inst.nome}</span>
              <Badge bg={inst.status === "conectado" ? C.greenLight : C.redLight} color={inst.status === "conectado" ? C.green : C.red}>
                {inst.status === "conectado" ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <div style={{ fontSize: 11, color: C.textSec }}>Número: {inst.número}</div>
            <div style={{ fontSize: 11, color: C.textSec }}>Responsável: {inst.responsável || "—"}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button style={{ ...sBtn(C.redLight, C.red), padding: "4px 10px", fontSize: 10 }}>Desconectar</button>
            </div>
          </div>
        ))}
        {instances.length === 0 && (
          <div style={{ ...sCard, padding: 32, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 8 }}>Nenhuma instância conectada</div>
            <button onClick={() => setShowConnect(true)} style={sBtn()}>Conectar WhatsApp</button>
          </div>
        )}
      </div>

      {/* Chat area */}
      {instances.length > 0 && (
        <div style={{ display: "flex", gap: 14, height: 420 }}>
          {/* Conversations list */}
          <div style={{ ...sCard, width: 260, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
              <span>Conversas</span>
              <span style={{ fontSize: 11, color: C.accent }}>{convs.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {convs.map(c => (
                <div key={c.id} onClick={() => selectConv(c)} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: active?.id === c.id ? C.accentLight : C.white }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{c.nome}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: C.textLight }}>{c.time}</span>
                      {c.unread > 0 && <span style={{ background: C.green, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{c.unread}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: C.accent, fontWeight: 600 }}>{c.empresa}</div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.msg}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div style={{ ...sCard, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {active ? (<>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{active.nome}</div>
                  <div style={{ fontSize: 10, color: C.textSec }}>{active.empresa}</div>
                </div>
                <Badge bg={C.greenLight} color={C.green}>Online</Badge>
              </div>
              <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {chatMsgs.map(m => (
                  <div key={m.id} style={{ alignSelf: m.from === "user" ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                    <div style={{ background: m.from === "user" ? C.accent : C.bg, color: m.from === "user" ? "#fff" : C.text, padding: "8px 14px", borderRadius: m.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", fontSize: 12, lineHeight: 1.5 }}>{m.text}</div>
                    <div style={{ fontSize: 9, color: C.textLight, marginTop: 2, textAlign: m.from === "user" ? "right" : "left" }}>{m.time}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Digite uma mensagem..." style={{ ...sInput, flex: 1 }} />
                <button onClick={sendMsg} style={sBtn()}>Enviar</button>
              </div>
            </>) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.textLight }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>Selecione uma conversa</div>
                <div style={{ fontSize: 11 }}>Escolha um contato para iniciar</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connect Modal with QR Code */}
      {showConnect && (
        <Modal title="Conectar WhatsApp" onClose={() => setShowConnect(false)}>
          {!scanning && !scanDone && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div><div style={sLabel}>Nome da instância</div><input value={newInst.nome} onChange={e => setNewInst({...newInst, nome: e.target.value})} placeholder="Ex: Comercial, Suporte, Vendas..." style={sInput} /></div>
                <div><div style={sLabel}>Responsável</div><input value={newInst.responsável} onChange={e => setNewInst({...newInst, responsável: e.target.value})} placeholder="Nome do colaborador" style={sInput} /></div>
              </div>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Clique abaixo para gerar o QR Code</div>
                <button onClick={startScan} style={{ ...sBtn(), padding: "12px 32px", fontSize: 14 }}>Gerar QR Code</button>
              </div>
              <div style={{ background: C.bg, borderRadius: 8, padding: 14, marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 8 }}>Como conectar:</div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.8 }}>
                  1. Abra o WhatsApp no celular<br/>
                  2. Toque em "Aparelhos conectados"<br/>
                  3. Toque em "Conectar um aparelho"<br/>
                  4. Aponte a camera para o QR Code
                </div>
              </div>
            </div>
          )}

          {scanning && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Escaneie o QR Code com seu celular</div>
              <div style={{ background: C.orangeLight, border: `1px solid ${C.orange}`, borderRadius: 6, padding: "8px 14px", marginBottom: 16, fontSize: 11, color: C.orange, fontWeight: 600, textAlign: "left" }}>Protótipo: Na versão de produção, este QR Code será gerado pela Evolution API e funcionará normalmente para conectar seu WhatsApp.</div>
              {/* Simulated QR Code */}
              <div style={{ width: 200, height: 200, margin: "0 auto", background: C.white, border: `2px solid ${C.text}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {/* Simulated QR pattern */}
                  {Array.from({length: 16}, (_, r) => Array.from({length: 16}, (_, c) => {
                    const filled = ((r + c) % 3 === 0 || (r * c) % 5 === 0 || r < 3 || c < 3 || (r > 12 && c < 3) || (r < 3 && c > 12));
                    return filled ? <rect key={`${r}-${c}`} x={c*10} y={r*10} width="10" height="10" fill={C.text} /> : null;
                  })).flat()}
                </svg>
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>Aguardando leitura...</span>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 12 }}>O QR Code expira em 45 segundos</div>
            </div>
          )}

          {scanDone && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 6 }}>Conectado com sucesso!</div>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 20 }}>O WhatsApp foi vinculado a plataforma.</div>
              <button onClick={finishConnect} style={{ ...sBtn(), padding: "10px 32px" }}>Concluir</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

const STICKERS = ["👍", "😂", "❤️", "🎉", "👏", "🔥", "😢", "👀", "🙌", "💯", "✅", "⚠️"];

function ChatPage({ collabs = [], companyId, currentUser, profile, onProfileUpdate }) {
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const fileRef = useRef();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const msgsEndRef = useRef();

  const nomeAtual = profile?.nome || currentUser?.email || "Você";

  // Carrega os grupos da empresa; cria "Geral" se não existir nenhum ainda
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      let list = await fetchGroups(companyId);
      if (list.length === 0) {
        const geral = await createGroupDb(companyId, "Geral");
        list = [geral];
      }
      setGroups(list);
      setActiveChat({ id: "grupo-" + list[0].id, tipo: "grupo", nome: list[0].nome, groupId: list[0].id });
    })();
  }, [companyId]);

  // Carrega mensagens do canal ativo + assina atualizações em tempo real
  useEffect(() => {
    if (!activeChat) return;
    setLoadingMsgs(true);
    fetchChatMessages(companyId, activeChat.id).then(list => { setMsgs(list); setLoadingMsgs(false); });
    const unsub = subscribeToChat(activeChat.id, novaMsg => setMsgs(prev => [...prev, novaMsg]));
    return unsub;
  }, [activeChat, companyId]);

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (tipo = "texto", conteudo = null) => {
    const valor = conteudo ?? txt;
    if (!valor || !valor.trim?.() && typeof valor !== "string") return;
    if (tipo === "texto" && !valor.trim()) return;
    try {
      await sendChatMessage({ companyId, channelId: activeChat.id, senderId: currentUser?.id, senderNome: nomeAtual, tipo, conteudo: valor });
      if (tipo === "texto") setTxt("");
    } catch (e) { console.error(e); }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !companyId) return;
    const novo = await createGroupDb(companyId, newGroupName);
    setGroups(prev => [...prev, novo]);
    setNewGroupName(""); setShowNewGroup(false);
  };

  const toggleMember = async (nome) => {
    const group = groups.find(g => g.id === activeChat.groupId);
    if (!group) return;
    const has = group.membros.includes(nome);
    const novaLista = has ? group.membros.filter(n => n !== nome) : [...group.membros, nome];
    await updateGroupMembersDb(group.id, novaLista);
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, membros: novaLista } : g));
  };

  const handleImageUpload = async (file) => {
    if (!file || !companyId) return;
    try {
      const url = await uploadMedia(companyId, "chat", file);
      await send("imagem", url);
    } catch (e) { alert("Não foi possível enviar a imagem."); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "audio.webm", { type: "audio/webm" });
        try {
          const url = await uploadMedia(companyId, "chat", file);
          await send("audio", url);
        } catch (e) { alert("Não foi possível enviar o áudio."); }
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (e) { alert("Não foi possível acessar o microfone. Verifique as permissões do navegador."); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const activeGroup = groups.find(g => g.id === activeChat?.groupId);
  const avatarColors = ["#6D28D9", "#0369A1", "#059669", "#D97706", "#DC2626", "#7C3AED"];
  const getColor = (nome) => avatarColors[(nome || "").length % avatarColors.length];

  const backgroundUrl = profile?.chat_background_url;

  const uploadBackground = async (file) => {
    if (!file || !companyId || !currentUser) return;
    try {
      const url = await uploadMedia(companyId, "backgrounds", file);
      await updateProfileFields(currentUser.id, { chat_background_url: url });
      onProfileUpdate?.({ ...profile, chat_background_url: url });
    } catch (e) { alert("Não foi possível enviar a imagem de fundo."); }
  };

  if (!activeChat) return <div style={{ padding: 40, textAlign: "center", color: C.textSec, fontSize: 12 }}>Carregando chat...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Chat Interno</h2>
        <label style={{ ...sBtn(C.bg, C.accent), border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 11 }}>
          Mudar imagem de fundo
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadBackground(e.target.files[0])} />
        </label>
      </div>

      <div style={{
        display: "flex", gap: 0, height: 500, borderRadius: 12, overflow: "visible", border: `1px solid ${C.border}`,
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : "linear-gradient(135deg, #EDE9FE 0%, #DBEAFE 50%, #E0F2FE 100%)",
        backgroundSize: "cover", backgroundPosition: "center", position: "relative",
      }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", borderRadius: "12px 0 0 12px", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 }}>Grupos</span>
            <button onClick={() => setShowNewGroup(true)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 16, fontWeight: 700, fontFamily: font }}>+</button>
          </div>
          {groups.map(g => (
            <div key={g.id} onClick={() => setActiveChat({ id: "grupo-" + g.id, tipo: "grupo", nome: g.nome, groupId: g.id })}
              style={{ padding: "8px 14px", cursor: "pointer", background: activeChat.groupId === g.id ? C.accentLight : "transparent", borderLeft: activeChat.groupId === g.id ? `3px solid ${C.accent}` : "3px solid transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: activeChat.groupId === g.id ? 700 : 400 }}>{g.nome}</span>
              <span style={{ fontSize: 10, color: C.textLight }}>{g.membros.length}</span>
            </div>
          ))}

          <div style={{ padding: "14px 14px 8px", marginTop: 8, borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 }}>Mensagens diretas</span>
          </div>
          {collabs.length === 0 && <div style={{ padding: "8px 14px", fontSize: 11, color: C.textLight }}>Cadastre colaboradores na aba Equipe</div>}
          {collabs.map(c => {
            const dmId = "dm-" + [currentUser?.id, c.id].sort().join("-");
            return (
              <div key={c.id} onClick={() => setActiveChat({ id: dmId, tipo: "dm", nome: c.nome })} style={{ padding: "8px 14px", cursor: "pointer", background: activeChat.id === dmId ? C.accentLight : "transparent", borderLeft: activeChat.id === dmId ? `3px solid ${C.accent}` : "3px solid transparent", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: activeChat.id === dmId ? 700 : 400 }}>{c.nome}</span>
              </div>
            );
          })}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", borderRadius: "0 12px 12px 0", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{activeChat.nome}</span>
              {activeChat.tipo === "grupo" && <span style={{ fontSize: 11, color: C.textSec, marginLeft: 8 }}>{activeGroup?.membros.length || 0} membros</span>}
            </div>
            {activeChat.tipo === "grupo" && <button onClick={() => setShowMembers(true)} style={{ ...sBtn(C.bg, C.accent), border: `1px solid ${C.border}`, padding: "5px 12px", fontSize: 11 }}>Gerenciar membros</button>}
          </div>

          <div style={{ flex: 1, padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {loadingMsgs && <div style={{ textAlign: "center", color: C.textLight, fontSize: 12 }}>Carregando mensagens...</div>}
            {!loadingMsgs && msgs.length === 0 && <div style={{ textAlign: "center", color: C.textLight, fontSize: 12, marginTop: 40 }}>Nenhuma mensagem ainda. Comece a conversa!</div>}
            {msgs.map(m => (
              <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: getColor(m.sender_nome), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                  {m.sender_nome?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: m.sender_nome === nomeAtual ? C.accent : C.text }}>{m.sender_nome}</span>
                    <span style={{ fontSize: 10, color: C.textLight }}>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {m.tipo === "texto" && <div style={{ fontSize: 13, marginTop: 3, color: C.text, lineHeight: 1.5 }}>{m.conteudo}</div>}
                  {m.tipo === "figurinha" && <div style={{ fontSize: 36, marginTop: 3 }}>{m.conteudo}</div>}
                  {m.tipo === "imagem" && <img src={m.conteudo} alt="imagem enviada" style={{ maxWidth: 240, maxHeight: 240, borderRadius: 8, marginTop: 4, display: "block" }} />}
                  {m.tipo === "audio" && <audio controls src={m.conteudo} style={{ marginTop: 4, height: 34 }} />}
                </div>
              </div>
            ))}
            <div ref={msgsEndRef} />
          </div>

          <div style={{ padding: "10px 18px", borderTop: `1px solid ${C.border}`, position: "relative" }}>
            {showStickers && (
              <div style={{ position: "absolute", bottom: "100%", left: 18, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}>
                {STICKERS.map(s => (
                  <button key={s} onClick={() => { send("figurinha", s); setShowStickers(false); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4 }}>{s}</button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} title="Enviar foto" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>📷</button>
              <button onClick={() => setShowStickers(!showStickers)} title="Figurinhas" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>😊</button>
              <button onClick={recording ? stopRecording : startRecording} title="Gravar áudio" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: recording ? C.red : C.text }}>{recording ? "⏹️" : "🎤"}</button>
              <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={`Mensagem para ${activeChat.nome}...`} style={{ ...sInput, flex: 1 }} />
              <button onClick={() => send()} style={sBtn()}>Enviar</button>
            </div>
          </div>
        </div>
      </div>

      {showNewGroup && <Modal title="Criar grupo" onClose={() => setShowNewGroup(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={sLabel}>Nome do grupo</div><input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Ex: Marketing, Prospecção, Financeiro..." style={sInput} /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowNewGroup(false)} style={sBtn(C.bg, C.text)}>Cancelar</button>
            <button onClick={createGroup} style={sBtn()}>Criar grupo</button>
          </div>
        </div>
      </Modal>}

      {showMembers && activeGroup && (
        <Modal title={`Membros de "${activeGroup.nome}"`} onClose={() => setShowMembers(false)}>
          {collabs.length === 0 && <div style={{ fontSize: 12, color: C.textSec, textAlign: "center", padding: 20 }}>Nenhum colaborador cadastrado ainda. Cadastre na aba Equipe primeiro.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {collabs.map(c => {
              const isMember = activeGroup.membros.includes(c.nome);
              return (
                <div key={c.id} onClick={() => toggleMember(c.nome)} style={{
                  ...sCard, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: isMember ? C.accentLight : C.white, border: isMember ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>{ROLES.find(r => r.id === c.cargo)?.label || c.cargo}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isMember ? C.accent : C.textLight }}>{isMember ? "✓ No grupo" : "Adicionar"}</span>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

function NewsPage() {
  const dolarData = [
    { dia: "24/06", valor: 5.45 }, { dia: "25/06", valor: 5.51 }, { dia: "26/06", valor: 5.48 },
    { dia: "27/06", valor: 5.55 }, { dia: "28/06", valor: 5.60 }, { dia: "01/07", valor: 5.65 },
    { dia: "02/07", valor: 5.68 }, { dia: "03/07", valor: 5.72 },
  ];
  const euroData = [
    { dia: "24/06", valor: 6.10 }, { dia: "25/06", valor: 6.15 }, { dia: "26/06", valor: 6.12 },
    { dia: "27/06", valor: 6.20 }, { dia: "28/06", valor: 6.18 }, { dia: "01/07", valor: 6.25 },
    { dia: "02/07", valor: 6.30 }, { dia: "03/07", valor: 6.28 },
  ];

  const MiniChart = ({ data, color, label, current, change, up }) => {
    const min = Math.min(...data.map(d => d.valor)) - 0.05;
    const max = Math.max(...data.map(d => d.valor)) + 0.05;
    const w = 240, h = 80;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.valor - min) / (max - min)) * h;
      return `${x},${y}`;
    }).join(" ");
    const areaPoints = points + ` ${w},${h} 0,${h}`;

    return (
      <div style={{ ...sCard, padding: "18px 20px", flex: 1, minWidth: 280 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 2 }}>{current}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: up ? C.green : C.red }}>{change}</div>
            <div style={{ fontSize: 10, color: C.textSec }}>últimos 7 dias</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 80 }}>
          <defs><linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
          <polygon points={areaPoints} fill={`url(#grad-${label})`} />
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((d.valor - min) / (max - min)) * h;
            return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
          })}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: C.textLight }}>
          {data.map((d, i) => i % 2 === 0 ? <span key={i}>{d.dia}</span> : <span key={i}></span>)}
        </div>
      </div>
    );
  };

  const investData = [
    { nome: "Ibovespa", valor: "132.450", change: "-0,4%", up: false },
    { nome: "S&P 500", valor: "5.528", change: "+0,6%", up: true },
    { nome: "Bitcoin", valor: "US$ 62.400", change: "+2,1%", up: true },
    { nome: "Ouro", valor: "US$ 2.340", change: "+0,3%", up: true },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Mercado e Notícias</h2>

      {/* Currency indicators */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { l: "Dólar (USD/BRL)", v: "R$ 5,72", ch: "+0,8%", up: true, c: C.blue },
          { l: "Euro (EUR/BRL)", v: "R$ 6,28", ch: "+0,5%", up: true, c: C.accent },
          { l: "Selic", v: "14,75%", ch: "estável", up: null, c: C.orange },
          { l: "IPCA (12m)", v: "4,2%", ch: "+0,3%", up: true, c: C.red },
        ].map(i => (
          <div key={i.l} style={{ ...sCard, padding: "14px 18px", flex: 1, minWidth: 140, borderLeft: `3px solid ${i.c}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: "uppercase" }}>{i.l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginTop: 2 }}>{i.v}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: i.up === true ? C.green : i.up === false ? C.red : C.textSec }}>{i.ch}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <MiniChart data={dolarData} color={C.blue} label="Dólar" current="R$ 5,72" change="+4,9%" up={true} />
        <MiniChart data={euroData} color={C.accent} label="Euro" current="R$ 6,28" change="+2,9%" up={true} />
      </div>

      {/* Investments */}
      <div style={{ ...sCard, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Investimentos</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {investData.map(inv => (
            <div key={inv.nome} style={{ ...sCard, padding: "14px 18px", flex: 1, minWidth: 140, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{inv.nome}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 2 }}>{inv.valor}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: inv.up ? C.green : C.red, background: inv.up ? C.greenLight : C.redLight, padding: "4px 10px", borderRadius: 6 }}>
                {inv.up ? "▲" : "▼"} {inv.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News */}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Notícias do dia</div>
      {NEWS_ITEMS.map(n => (
        <div key={n.id} style={{ ...sCard, padding: "14px 20px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <Badge>{n.fonte}</Badge>
              <Badge bg={C.bg} color={C.textSec}>{n.cat}</Badge>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{n.titulo}</div>
          </div>
          <span style={{ fontSize: 11, color: C.textLight, whiteSpace: "nowrap" }}>{n.tempo}</span>
        </div>
      ))}
    </div>
  );
}

function PaymentsPage() { const inv = [{ ref: "JUL/2026", v: "R$ 3.000,00", venc: "10/07/2026", st: "aberto" }, { ref: "JUN/2026", v: "R$ 3.000,00", venc: "10/06/2026", st: "pago" }, { ref: "MAI/2026", v: "R$ 3.000,00", venc: "10/05/2026", st: "pago" }];
  return (<div><h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Pagamentos</h2>
    <div style={{ ...sCard, padding: 18, marginBottom: 20 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Gateway de pagamento</div><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Badge bg={C.greenLight} color={C.green}>Conectado</Badge><span style={{ fontSize: 12 }}>Mercado Pago</span><span style={{ fontSize: 11, color: C.textSec }}>| Boleto, PIX e Cartão de Crédito</span></div></div>
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>{PLANS.map(p => <div key={p.id} style={{ ...sCard, padding: 22, flex: 1, minWidth: 170, border: p.id === "scale" ? `2px solid ${C.accent}` : `1px solid ${C.border}` }}>{p.id === "scale" && <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, marginBottom: 4 }}>PLANO ATUAL</div>}<div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 20, fontWeight: 800, color: C.accent, margin: "4px 0" }}>{p.price}</div><div style={{ fontSize: 11, color: C.textSec }}>{p.leads} leads/mes</div>{p.benefits.map((b, i) => <div key={i} style={{ fontSize: 11, padding: "2px 0", marginTop: i === 0 ? 8 : 0, borderTop: i === 0 ? `1px solid ${C.border}` : "" }}>{b}</div>)}{p.id !== "scale" && <button style={{ ...sBtn(C.bg, C.accent), marginTop: 10, width: "100%", border: `1px solid ${C.border}` }}>{p.id === "custom" ? "Solicitar" : "Mudar plano"}</button>}</div>)}</div>
    <div style={{ ...sCard, overflow: "hidden" }}><div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>Faturas</div><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>{["Ref.", "Valor", "Venc.", "Status", ""].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.textSec, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}</tr></thead><tbody>{inv.map(i => <tr key={i.ref} style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "10px 14px", fontWeight: 600 }}>{i.ref}</td><td style={{ padding: "10px 14px" }}>{i.v}</td><td style={{ padding: "10px 14px", color: C.textSec }}>{i.venc}</td><td style={{ padding: "10px 14px" }}><Badge bg={i.st === "pago" ? C.greenLight : C.orangeLight} color={i.st === "pago" ? C.green : C.orange}>{i.st === "pago" ? "Pago" : "Em aberto"}</Badge></td><td style={{ padding: "10px 14px" }}>{i.st !== "pago" && <button style={sBtn()}>Pagar</button>}</td></tr>)}</tbody></table></div></div>);
}

function HelpPage() { const [open, setOpen] = useState(null); return (<div><h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Central de Ajuda</h2><p style={{ fontSize: 12, color: C.textSec, margin: "0 0 20px" }}>Passo a passo de como usar cada funcionalidade.</p>{HELP_ITEMS.map((item, i) => <div key={i} style={{ ...sCard, marginBottom: 8, overflow: "hidden" }}><div onClick={() => setOpen(open === i ? null : i)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</span><span style={{ color: C.textSec, fontSize: 16 }}>{open === i ? "−" : "+"}</span></div>{open === i && <div style={{ padding: "0 18px 16px" }}>{item.steps.map((s, j) => <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0" }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: C.accentLight, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{j + 1}</div><span style={{ fontSize: 12 }}>{s}</span></div>)}</div>}</div>)}</div>); }

function ManutencaoPage({ nome }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{nome} em manutenção</h2>
      <p style={{ fontSize: 13, color: C.textSec, maxWidth: 360, lineHeight: 1.6 }}>
        Estamos trabalhando para deixar essa área disponível em breve. Volte mais tarde para conferir as novidades.
      </p>
    </div>
  );
}

/* ═══ PINCELAB (planilha livre, estilo Excel/Sheets) ═══ */
const FONT_OPTIONS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New"];
const FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24];

function PincelabPage({ companyId }) {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [colWidths, setColWidths] = useState([]);
  const [styles, setStyles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // { r, c }
  const [openFilter, setOpenFilter] = useState(null); // idx da coluna com o dropdown de filtro aberto
  const [columnFilters, setColumnFilters] = useState({}); // { colIdx: Set(valores permitidos) }
  const saveTimer = useRef(null);
  const loadedOnce = useRef(false);
  const colCounter = useRef(0);
  const resizing = useRef(null);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setLoading(true);
      const sheet = await fetchPincelabSheet(companyId);
      if (sheet) {
        const cols = sheet.columns || ["Empresa", "Contato", "Telefone", "Email", "Status", "Observações"];
        setColumns(cols);
        setRows(sheet.rows || []);
        setColWidths(sheet.col_widths?.length === cols.length ? sheet.col_widths : cols.map(() => 150));
        setStyles(sheet.styles || {});
        colCounter.current = cols.length;
      }
      loadedOnce.current = true;
      setLoading(false);
    })();
  }, [companyId]);

  // Autosave com debounce, pra não gravar a cada tecla digitada
  useEffect(() => {
    if (!loadedOnce.current || loading) return;
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await savePincelabSheet(companyId, columns, rows, colWidths, styles); } catch (e) { console.error(e); }
      setSaving(false);
    }, 900);
    return () => clearTimeout(saveTimer.current);
  }, [columns, rows, colWidths, styles]);

  const addColumn = () => {
    colCounter.current += 1;
    setColumns(prev => [...prev, `Coluna ${colCounter.current}`]);
    setColWidths(prev => [...prev, 150]);
  };
  const removeColumn = (idx) => {
    setColumns(prev => prev.filter((_, i) => i !== idx));
    setColWidths(prev => prev.filter((_, i) => i !== idx));
    setRows(prev => prev.map(r => r.filter((_, i) => i !== idx)));
    setColumnFilters(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };
  const renameColumn = (idx, val) => setColumns(prev => prev.map((c, i) => i === idx ? val : c));
  const addRow = (qtd = 1) => setRows(prev => [...prev, ...Array.from({ length: qtd }, () => columns.map(() => ""))]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));
  const setCell = (r, c, val) => setRows(prev => prev.map((row, i) => i === r ? row.map((cell, j) => j === c ? val : cell) : row));
  const limparTudo = () => { if (window.confirm("Limpar toda a planilha do PincelAb? Essa ação não pode ser desfeita.")) { setColumns(["Empresa", "Contato", "Telefone", "Email", "Status", "Observações"]); setRows(Array.from({ length: 1000 }, () => Array(6).fill(""))); setStyles({}); colCounter.current = 6; } };

  // Formatação da célula selecionada
  const cellKey = (r, c) => `${r}-${c}`;
  const currentStyle = selectedCell ? (styles[cellKey(selectedCell.r, selectedCell.c)] || {}) : {};
  const applyStyle = (patch) => {
    if (!selectedCell) return;
    setStyles(prev => ({ ...prev, [cellKey(selectedCell.r, selectedCell.c)]: { ...prev[cellKey(selectedCell.r, selectedCell.c)], ...patch } }));
  };

  // Redimensionar coluna arrastando a borda
  const startResize = (idx, e) => {
    resizing.current = { idx, startX: e.clientX, startWidth: colWidths[idx] || 150 };
    const onMove = (ev) => {
      if (!resizing.current) return;
      const novaLargura = Math.max(60, resizing.current.startWidth + (ev.clientX - resizing.current.startX));
      setColWidths(prev => prev.map((w, i) => i === resizing.current.idx ? novaLargura : w));
    };
    const onUp = () => { resizing.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Valores únicos de uma coluna (pra montar o filtro)
  const valoresUnicos = (colIdx) => [...new Set(rows.map(r => r[colIdx] || "").filter(v => v !== ""))].sort();
  const toggleFiltroValor = (colIdx, valor) => {
    setColumnFilters(prev => {
      const atual = prev[colIdx] || new Set(valoresUnicos(colIdx));
      const novo = new Set(atual);
      novo.has(valor) ? novo.delete(valor) : novo.add(valor);
      return { ...prev, [colIdx]: novo };
    });
  };
  const linhaVisivel = (row) => Object.entries(columnFilters).every(([colIdx, permitidos]) => {
    const v = row[colIdx] || "";
    if (v === "") return true; // não esconde linhas em branco
    return permitidos.has(v);
  });
  const rowsFiltradas = rows.map((r, idx) => ({ r, idx })).filter(({ r }) => linhaVisivel(r));
  const temFiltroAtivo = Object.keys(columnFilters).length > 0;

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textSec, fontSize: 12 }}>Carregando PincelAb...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>PincelAb</h2>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>Sua planilha livre — organize os leads do seu jeito. {saving ? "Salvando..." : "Tudo salvo."}{temFiltroAtivo && " • Filtro ativo"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={addColumn} style={sBtn(C.bg, C.accent)}>+ Coluna</button>
          <button onClick={() => addRow(1)} style={sBtn()}>+ Linha</button>
          <button onClick={() => addRow(100)} style={sBtn(C.bg, C.accent)}>+ 100 linhas</button>
          <button onClick={limparTudo} style={sBtn(C.red)}>Limpar tudo</button>
        </div>
      </div>

      {/* Barra de formatação, estilo Google Sheets — aplica na célula selecionada */}
      <div style={{ ...sCard, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", opacity: selectedCell ? 1 : 0.5 }}>
        <span style={{ fontSize: 10, color: C.textSec, fontWeight: 600 }}>{selectedCell ? "Formatar célula:" : "Clique numa célula pra formatar"}</span>
        <select disabled={!selectedCell} value={currentStyle.fontFamily || "Arial"} onChange={e => applyStyle({ fontFamily: e.target.value })} style={{ ...sSelect, width: 160, padding: "4px 8px", fontSize: 11 }}>
          {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select disabled={!selectedCell} value={currentStyle.fontSize || 12} onChange={e => applyStyle({ fontSize: Number(e.target.value) })} style={{ ...sSelect, width: 64, padding: "4px 8px", fontSize: 11 }}>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button disabled={!selectedCell} onClick={() => applyStyle({ bold: !currentStyle.bold })} style={{ ...sBtn(currentStyle.bold ? C.accent : C.bg, currentStyle.bold ? "#fff" : C.text), padding: "5px 12px", fontWeight: 800 }}>B</button>
        <button disabled={!selectedCell} onClick={() => applyStyle({ italic: !currentStyle.italic })} style={{ ...sBtn(currentStyle.italic ? C.accent : C.bg, currentStyle.italic ? "#fff" : C.text), padding: "5px 12px", fontStyle: "italic" }}>I</button>
        <input disabled={!selectedCell} type="color" value={currentStyle.color || "#111111"} onChange={e => applyStyle({ color: e.target.value })} style={{ width: 30, height: 26, border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer" }} title="Cor do texto" />
        <input disabled={!selectedCell} type="color" value={currentStyle.bg || "#ffffff"} onChange={e => applyStyle({ bg: e.target.value })} style={{ width: 30, height: 26, border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer" }} title="Cor de fundo" />
        {temFiltroAtivo && <button onClick={() => setColumnFilters({})} style={{ ...sBtn(C.bg, C.red), fontSize: 11 }}>Limpar filtros</button>}
      </div>

      <div style={{ ...sCard, overflow: "auto", maxHeight: "65vh", position: "relative" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              <th style={{ padding: "8px 6px", width: 36, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, position: "sticky", left: 0, background: C.bg, zIndex: 2 }}></th>
              {columns.map((col, ci) => {
                const unicos = valoresUnicos(ci);
                const permitidos = columnFilters[ci];
                return (
                  <th key={ci} style={{ padding: "6px 6px", borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, width: colWidths[ci] || 150, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <input value={col} onChange={e => renameColumn(ci, e.target.value)} style={{ ...sInput, padding: "4px 5px", fontWeight: 700, fontSize: 11, minWidth: 0, flex: 1 }} />
                      <button onClick={() => setOpenFilter(openFilter === ci ? null : ci)} title="Filtrar" style={{ background: "none", border: "none", color: permitidos ? C.accent : C.textSec, cursor: "pointer", fontSize: 12, padding: "2px 3px" }}>▾</button>
                      <button onClick={() => removeColumn(ci)} title="Remover coluna" style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                    </div>
                    {openFilter === ci && (
                      <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 14px rgba(0,0,0,.12)", zIndex: 10, width: 200, maxHeight: 220, overflowY: "auto", padding: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.textSec, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                          <span>Filtrar "{col}"</span>
                          <button onClick={() => setColumnFilters(prev => { const n = { ...prev }; delete n[ci]; return n; })} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 10 }}>Tudo</button>
                        </div>
                        {unicos.length === 0 && <div style={{ fontSize: 11, color: C.textLight }}>Sem valores ainda.</div>}
                        {unicos.map(v => (
                          <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 0", cursor: "pointer" }}>
                            <input type="checkbox" checked={!permitidos || permitidos.has(v)} onChange={() => toggleFiltroValor(ci, v)} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div onMouseDown={e => startResize(ci, e)} style={{ position: "absolute", top: 0, right: 0, width: 6, height: "100%", cursor: "col-resize" }} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowsFiltradas.length === 0 && (
              <tr><td colSpan={columns.length + 1} style={{ padding: 24, textAlign: "center", color: C.textLight, fontSize: 12 }}>Nenhuma linha visível. {temFiltroAtivo ? "Confere os filtros ativos." : "Clique em \"+ Linha\" ou mande leads da tela de Leads direto pra cá."}</td></tr>
            )}
            {rowsFiltradas.map(({ r: row, idx: ri }) => (
              <tr key={ri} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "4px 6px", textAlign: "center", borderRight: `1px solid ${C.border}`, color: C.textLight, fontSize: 10, position: "sticky", left: 0, background: "#fff" }}>
                  <button onClick={() => removeRow(ri)} title="Remover linha" style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 13 }}>×</button>
                </td>
                {columns.map((_, ci) => {
                  const st = styles[cellKey(ri, ci)] || {};
                  const selecionada = selectedCell && selectedCell.r === ri && selectedCell.c === ci;
                  return (
                    <td key={ci} style={{ padding: 0, borderRight: `1px solid ${C.border}`, background: st.bg || (selecionada ? C.accentLight : "transparent"), outline: selecionada ? `2px solid ${C.accent}` : "none", outlineOffset: -2 }}>
                      <input
                        value={row[ci] || ""}
                        onFocus={() => setSelectedCell({ r: ri, c: ci })}
                        onChange={e => setCell(ri, ci, e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", border: "none", padding: "7px 8px", fontSize: st.fontSize || 12, fontFamily: st.fontFamily || font, fontWeight: st.bold ? 700 : 400, fontStyle: st.italic ? "italic" : "normal", color: st.color || C.text, outline: "none", background: "transparent" }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPage({ profile, currentUser, onProfileUpdate }) {
  const [uploading, setUploading] = useState(false);
  const avatarUrl = profile?.avatar_url;

  const uploadAvatar = async (file) => {
    if (!file || !currentUser || !profile?.company_id) return;
    setUploading(true);
    try {
      const url = await uploadMedia(profile.company_id, "avatars", file);
      await updateProfileFields(currentUser.id, { avatar_url: url });
      onProfileUpdate?.({ ...profile, avatar_url: url });
    } catch (e) { alert("Não foi possível enviar a foto."); }
    setUploading(false);
  };

  return (<div><h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Configurações</h2><div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
    <div style={{ ...sCard, padding: 24, flex: 1, minWidth: 260 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Perfil</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>{(profile?.nome || "?").slice(0, 2).toUpperCase()}</span>}
        </div>
        <label style={{ ...sBtn(C.bg, C.accent), border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 11 }}>
          {uploading ? "Enviando..." : "Trocar foto"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadAvatar(e.target.files[0])} disabled={uploading} />
        </label>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={sLabel}>Nome da empresa</div><input defaultValue={profile?.nome || "Minha Empresa"} style={sInput} /></div>
        <div><div style={sLabel}>Email</div><input defaultValue={currentUser?.email || ""} style={sInput} disabled /></div>
        <div><div style={sLabel}>Telefone</div><input defaultValue="(11) 99999-0000" style={sInput} /></div>
        <button style={sBtn()}>Salvar</button>
      </div>
    </div>
    <div style={{ ...sCard, padding: 24, flex: 1, minWidth: 260 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Preferências</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[["Notificações por email", true], ["Alerta de limite de leads", true]].map(([l, v]) => <div key={l} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12 }}>{l}</span><Badge bg={C.greenLight} color={C.green}>Ativado</Badge></div>)}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12 }}>Idioma</span><select defaultValue="pt" style={{ ...sSelect, width: 130 }}><option value="pt">Portugues</option><option value="en">English</option><option value="es">Espanol</option></select></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12 }}>Tema</span><select defaultValue="light" style={{ ...sSelect, width: 130 }}><option value="light">Claro</option><option value="dark">Escuro</option></select></div>
      </div>
    </div>
  </div></div>);
}

function MasterExportLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchExportLogs().then(l => { setLogs(l); setLoading(false); }); }, []);

  const totalArrecadado = logs.reduce((a, l) => a + Number(l.valor || 0), 0);
  const totalLeadsExportados = logs.reduce((a, l) => a + Number(l.quantidade || 0), 0);

  return (
    <div style={{ ...sCard, overflow: "hidden", marginTop: 20 }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Log de Exportações</span>
        <span style={{ fontSize: 11, color: C.textSec }}>{totalLeadsExportados} leads exportados no total | R$ {totalArrecadado.toFixed(2)} arrecadado</span>
      </div>
      {loading && <div style={{ padding: 20, textAlign: "center", color: C.textSec, fontSize: 12 }}>Carregando...</div>}
      {!loading && logs.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.textLight, fontSize: 12 }}>Nenhuma exportação registrada ainda.</div>}
      {!loading && logs.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {["Empresa", "Usuário", "Quantidade", "Valor pago", "Código (marca d'água)", "Data"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.textSec, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{l.empresa_nome || "—"}</td>
                  <td style={{ padding: "10px 12px", color: C.textSec }}>{l.user_email}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.accent }}>{l.quantidade}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.green }}>R$ {Number(l.valor).toFixed(2)}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>{l.codigo}</td>
                  <td style={{ padding: "10px 12px", color: C.textSec, fontSize: 11 }}>{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MasterPanel({ companies, poolCount, loading, onUpdateLimit, onToggleStatus, onDeleteCompany }) {
  const totalDistribuidos = companies.reduce((acc, c) => acc + (c.leadsUsados || 0), 0);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const salvar = async (companyId) => {
    const novo = edits[companyId];
    if (novo === undefined || novo === "") return;
    setSaving(companyId);
    try {
      await onUpdateLimit(companyId, Number(novo));
      setEdits(prev => { const n = { ...prev }; delete n[companyId]; return n; });
    } catch (e) {
      alert(e.message || "Erro ao salvar o limite.");
    }
    setSaving(null);
  };

  const alternarStatus = async (c) => {
    const novoStatus = c.status === "bloqueado" ? "ativo" : "bloqueado";
    let motivo = "";
    if (novoStatus === "bloqueado") {
      motivo = window.prompt(`Bloquear "${c.empresa}"? Ninguém da equipe dessa empresa vai conseguir acessar o sistema até você desbloquear.\n\nEscreva o motivo que o cliente vai ver na tela (ex: "Pagamento pendente. Entre em contato pelo WhatsApp XX."):`, "Pagamento pendente. Entre em contato com o suporte para regularizar.");
      if (motivo === null) return; // cancelou
    }
    setToggling(c.id);
    try {
      await onToggleStatus(c.id, novoStatus, motivo);
    } catch (e) {
      alert(e.message || "Erro ao alterar o status.");
    }
    setToggling(null);
  };

  const excluir = async (c) => {
    if (!window.confirm(`Excluir "${c}" para sempre? Todos os logins da equipe são removidos. Os leads que estavam com esse cliente voltam pro seu estoque (não são perdidos). Essa ação não pode ser desfeita.`)) return;
    setDeleting(c.id);
    try {
      await onDeleteCompany(c.id);
    } catch (e) {
      alert(e.message || "Erro ao excluir o cliente.");
    }
    setDeleting(null);
  };

  return (<div><h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Painel Master</h2><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>{[{ t: "Clientes ativos", v: companies.filter(c => c.status !== "bloqueado").length, c: C.accent }, { t: "Leads no estoque", v: poolCount, c: C.orange }, { t: "Leads distribuídos", v: totalDistribuidos, c: C.blue }].map((s, i) => <div key={i} style={{ ...sCard, padding: "18px 20px", flex: 1, minWidth: 150 }}><div style={sLabel}>{s.t}</div><div style={{ fontSize: 26, fontWeight: 800, color: s.c, marginTop: 4 }}>{loading ? "…" : s.v}</div></div>)}</div>
    <div style={{ ...sCard, overflow: "hidden", marginBottom: 20 }}><div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>Clientes</div><div style={{ overflowX: "auto" }}>{loading ? <div style={{ padding: 20, fontSize: 12, color: C.textSec }}>Carregando clientes...</div> : companies.length === 0 ? <div style={{ padding: 20, fontSize: 12, color: C.textSec }}>Nenhum cliente cadastrado ainda.</div> : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>{["ID", "Empresa", "Plano", "Leads atribuídos", "Limite (cota)", "Status", "Ações"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.textSec, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead><tbody>{companies.map(c => { const limite = c.leadsLimite || 1; const pct = Math.min(100, Math.round((c.leadsUsados / limite) * 100)); const bloqueado = c.status === "bloqueado"; return (<tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: bloqueado ? 0.6 : 1 }}><td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11, fontWeight: 600 }}>{String(c.id).slice(0, 8)}</td><td style={{ padding: "10px 12px", fontWeight: 600 }}>{c.empresa}</td><td style={{ padding: "10px 12px" }}><Badge>{PLANS.find(p => p.id === c.plano)?.name || c.plano}</Badge></td><td style={{ padding: "10px 12px" }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ background: C.bg, borderRadius: 4, height: 6, width: 50, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? C.orange : C.accent, borderRadius: 4 }} /></div><span style={{ fontSize: 10, color: pct >= 80 ? C.orange : C.textSec, fontWeight: 600 }}>{c.leadsUsados}</span></div></td><td style={{ padding: "10px 12px" }}><div style={{ display: "flex", gap: 4, alignItems: "center" }}><input type="number" min="0" value={edits[c.id] !== undefined ? edits[c.id] : c.leadsLimite || 0} onChange={e => setEdits(prev => ({ ...prev, [c.id]: e.target.value }))} style={{ ...sInput, width: 80, padding: "4px 8px" }} /><button onClick={() => salvar(c.id)} disabled={saving === c.id} style={{ ...sBtn(), padding: "4px 10px", fontSize: 11 }}>{saving === c.id ? "..." : "Salvar"}</button></div></td><td style={{ padding: "10px 12px" }}>{bloqueado ? <Badge bg="#FEF2F2" color={C.red}>Bloqueado</Badge> : <Badge bg={C.greenLight} color={C.green}>Ativo</Badge>}</td><td style={{ padding: "10px 12px" }}><div style={{ display: "flex", gap: 6 }}><button onClick={() => alternarStatus(c)} disabled={toggling === c.id} style={{ ...sBtn(bloqueado ? C.green : C.orange), padding: "4px 10px", fontSize: 11 }}>{toggling === c.id ? "..." : bloqueado ? "Desbloquear" : "Bloquear"}</button><button onClick={() => excluir({ id: c.id, empresa: c.empresa })} disabled={deleting === c.id} style={{ ...sBtn(C.red), padding: "4px 10px", fontSize: 11 }}>{deleting === c.id ? "..." : "Excluir"}</button></div></td></tr>); })}</tbody></table>}</div></div>
    <MasterExportLogs />
    <MasterSupportInbox />
    </div>); }

function AuthPage({ onLoginSuccess, onMasterSuccess, onBack }) {
  const [mode, setMode] = useState("login"); // login | signup | check-email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  const doLogin = async () => {
    setError(""); setLoading(true);
    // Conta Master: credenciais fixas, não passam pelo Supabase
    if (email.trim().toLowerCase() === MASTER_EMAIL.toLowerCase() && password === MASTER_PASSWORD) {
      setLoading(false);
      onMasterSuccess();
      return;
    }
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      if (err.message?.toLowerCase().includes("confirm")) {
        setError("Você ainda não confirmou seu email. Verifique sua caixa de entrada e clique no link de confirmação.");
      } else {
        setError("Email ou senha incorretos.");
      }
      return;
    }
    onLoginSuccess(data.user);
  };

  const doSignup = async () => {
    setError(""); setLoading(true);
    if (!empresa.trim() || !email.trim() || password.length < 6) {
      setLoading(false); setError("Preencha todos os campos. A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { empresa }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (err) { setError(err.message || "Erro ao criar conta."); return; }
    setMode("check-email");
  };

  const resendLink = async () => {
    setError(""); setInfo("");
    const { error: err } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
    if (err) { setError("Não foi possível reenviar o email."); return; }
    setInfo("Email reenviado. Confira sua caixa de entrada.");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...sCard, padding: 32, width: 400, maxWidth: "92vw" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: C.sidebar, letterSpacing: 0.5 }}>MEETRIX</span>
            <span style={{ fontSize: 16, fontWeight: 400, color: C.textLight, margin: "0 8px" }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.accent, letterSpacing: 1, textTransform: "uppercase" }}>Smart Leads</span>
          </div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>
            {mode === "login" && "Acesse sua conta"}
            {mode === "signup" && "Crie sua conta"}
            {mode === "check-email" && "Confirme seu email"}
          </div>
        </div>

        {error && <div style={{ background: C.redLight, color: C.red, padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>{error}</div>}
        {info && <div style={{ background: C.greenLight, color: C.green, padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>{info}</div>}

        {mode === "login" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><div style={sLabel}>Email</div><input value={email} onChange={e => setEmail(e.target.value)} style={sInput} placeholder="seuemail@empresa.com" /></div>
            <div><div style={sLabel}>Senha</div><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={sInput} /></div>
            <button onClick={doLogin} disabled={loading} style={{ ...sBtn(), padding: "11px 0", fontSize: 13, width: "100%", opacity: loading ? 0.6 : 1 }}>{loading ? "Entrando..." : "Entrar"}</button>
            <div style={{ textAlign: "center", fontSize: 12, color: C.textSec }}>
              Não tem conta? <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: C.accent, fontWeight: 700, cursor: "pointer", fontFamily: font, fontSize: 12 }}>Criar conta</button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><div style={sLabel}>Nome da empresa</div><input value={empresa} onChange={e => setEmpresa(e.target.value)} style={sInput} placeholder="Sua empresa Ltda" /></div>
            <div><div style={sLabel}>Email</div><input value={email} onChange={e => setEmail(e.target.value)} style={sInput} placeholder="seuemail@empresa.com" /></div>
            <div><div style={sLabel}>Senha (mín. 6 caracteres)</div><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={sInput} /></div>
            <button onClick={doSignup} disabled={loading} style={{ ...sBtn(), padding: "11px 0", fontSize: 13, width: "100%", opacity: loading ? 0.6 : 1 }}>{loading ? "Criando..." : "Criar conta"}</button>
            <div style={{ textAlign: "center", fontSize: 12, color: C.textSec }}>
              Já tem conta? <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: C.accent, fontWeight: 700, cursor: "pointer", fontFamily: font, fontSize: 12 }}>Entrar</button>
            </div>
          </div>
        )}

        {mode === "check-email" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✉️</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>Enviamos um link de confirmação para <strong>{email}</strong>. Abra seu email e clique no link para ativar sua conta.</div>
            <button onClick={resendLink} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", fontFamily: font, fontWeight: 700 }}>Reenviar email</button>
            <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{ ...sBtn(C.bg, C.text), border: `1px solid ${C.border}`, padding: "9px 20px", fontSize: 12 }}>Já confirmei, ir para o login</button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 14 }}><button onClick={onBack} style={{ background: "none", border: "none", color: C.textSec, fontSize: 12, cursor: "pointer", fontFamily: font }}>Voltar ao início</button></div>
      </div>
    </div>
  );
}

function SupportChat({ show, onClose, userEmail, companyId }) {
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const boxRef = useRef();

  useEffect(() => {
    if (!show || !companyId) return;
    let unsub;
    (async () => {
      setLoading(true);
      const data = await fetchCompanySupportMessages(companyId);
      setMsgs(data);
      setLoading(false);
      unsub = subscribeToSupport(companyId, (msg) => setMsgs(prev => [...prev, msg]));
    })();
    return () => unsub?.();
  }, [show, companyId]);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs]);

  const send = async () => {
    if (!txt.trim() || !companyId || sending) return;
    setSending(true);
    try {
      await sendSupportMessageDb({ companyId, senderEmail: userEmail || "desconhecido", message: txt.trim() });
      setTxt("");
    } catch (e) {
      alert("Não foi possível enviar sua mensagem. Tente novamente em instantes.");
    }
    setSending(false);
  };

  if (!show) return null;
  return (<div style={{ position: "fixed", bottom: 20, right: 20, width: 340, height: 420, background: C.white, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.15)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 900, border: `1px solid ${C.border}` }}>
    <div style={{ padding: "12px 16px", background: C.sidebar, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700, fontSize: 13 }}>Suporte Meetrix</span><button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>x</button></div>
    <div ref={boxRef} style={{ flex: 1, padding: 12, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
      {loading && <div style={{ fontSize: 12, color: C.textSec, textAlign: "center" }}>Carregando conversa...</div>}
      {!loading && msgs.length === 0 && <div style={{ fontSize: 12, color: C.textSec, textAlign: "center" }}>Envie uma mensagem, alguém do time Meetrix vai te responder aqui mesmo.</div>}
      {msgs.map(m => <div key={m.id} style={{ alignSelf: m.remetente === "master" ? "flex-start" : "flex-end", maxWidth: "80%", background: m.remetente === "master" ? C.bg : C.accent, color: m.remetente === "master" ? C.text : "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>{m.message}</div>)}
    </div>
    <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6 }}><input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Sua mensagem..." style={{ ...sInput, flex: 1 }} disabled={sending} /><button onClick={send} style={sBtn()} disabled={sending}>{sending ? "..." : "Enviar"}</button></div>
  </div>);
}

/* ═══ MASTER SUPPORT INBOX ═══ */
function MasterSupportInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState(null);

  const load = async () => {
    try {
      const data = await fetchMasterSupportMessages();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); const interval = setInterval(load, 8000); return () => clearInterval(interval); }, []);

  // Agrupa as mensagens por empresa (uma conversa por cliente)
  const threads = useMemo(() => {
    const map = {};
    messages.forEach(m => {
      const key = m.company_id || "sem-empresa";
      if (!map[key]) map[key] = { companyId: m.company_id, empresa: m.companies?.name || "Empresa desconhecida", msgs: [] };
      map[key].msgs.push(m);
    });
    return Object.values(map).sort((a, b) => new Date(b.msgs.at(-1)?.created_at) - new Date(a.msgs.at(-1)?.created_at));
  }, [messages]);

  const enviarResposta = async (companyId) => {
    const texto = replyText[companyId];
    if (!texto?.trim()) return;
    setSendingReply(companyId);
    try {
      await replyMasterSupport(companyId, texto);
      setReplyText(prev => ({ ...prev, [companyId]: "" }));
      await load();
    } catch (e) {
      alert(e.message || "Erro ao enviar resposta.");
    }
    setSendingReply(null);
  };

  return (
    <div style={{ ...sCard, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>Mensagens de Suporte</div>
      {loading && <div style={{ padding: 20, textAlign: "center", color: C.textSec, fontSize: 12 }}>Carregando...</div>}
      {!loading && threads.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.textLight, fontSize: 12 }}>Nenhuma mensagem de suporte ainda.</div>}
      {threads.map(t => (
        <div key={t.companyId || "sem-empresa"} style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.accent, marginBottom: 8 }}>{t.empresa}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, maxHeight: 200, overflowY: "auto" }}>
            {t.msgs.map(m => (
              <div key={m.id} style={{ alignSelf: m.remetente === "master" ? "flex-end" : "flex-start", maxWidth: "85%", background: m.remetente === "master" ? C.accent : C.bg, color: m.remetente === "master" ? "#fff" : C.text, padding: "6px 10px", borderRadius: 6, fontSize: 12 }}>
                {m.message}
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{new Date(m.created_at).toLocaleString("pt-BR")}</div>
              </div>
            ))}
          </div>
          {t.companyId && <div style={{ display: "flex", gap: 6 }}>
            <input value={replyText[t.companyId] || ""} onChange={e => setReplyText(prev => ({ ...prev, [t.companyId]: e.target.value }))} onKeyDown={e => e.key === "Enter" && enviarResposta(t.companyId)} placeholder="Responder..." style={{ ...sInput, flex: 1 }} />
            <button onClick={() => enviarResposta(t.companyId)} disabled={sendingReply === t.companyId} style={sBtn()}>{sendingReply === t.companyId ? "..." : "Responder"}</button>
          </div>}
        </div>
      ))}
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function App() {
  const [view, setView] = useState("landing");
  const [role, setRole] = useState("admin");
  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [showSupport, setShowSupport] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null); // { company_id, cargo, nome, ... }
  const [loadingData, setLoadingData] = useState(false);
  const [masterCompanies, setMasterCompanies] = useState([]);
  const [poolCount, setPoolCount] = useState(0);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [platformTotal, setPlatformTotal] = useState(0);

  // Recarrega os dados do Master: leads no estoque (pool) e lista de clientes reais
  const reloadMasterData = async () => {
    setLoadingMaster(true);
    try {
      const [poolLeads, companiesData] = await Promise.all([
        fetchMasterPoolLeads({ limit: 5000 }),
        fetchMasterCompanies(),
      ]);
      setLeads(poolLeads);
      setMasterCompanies(companiesData.companies);
      setPoolCount(companiesData.poolCount);
    } catch (e) {
      console.error("Erro ao carregar dados do Master:", e);
      alert("Não foi possível carregar os dados do Master. Confira se SUPABASE_SERVICE_ROLE_KEY está configurada.");
    }
    setLoadingMaster(false);
  };

  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  // Depois do login (não-master), garante perfil/empresa e carrega os dados reais
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setLoadingData(true);
    try {
      const prof = await ensureProfileAndCompany(user);
      const statusInfo = await fetchCompanyStatus(prof.company_id);
      if (statusInfo.status === "bloqueado") {
        setBlockedReason(statusInfo.reason || "");
        setBlocked(true);
        setLoadingData(false);
        return; // não carrega leads, equipe, nada — acesso totalmente bloqueado
      }
      setProfile(prof);
      setRole(prof.cargo === "admin" ? "admin" : "colaborador");
      const [dbLeads, dbCollabs] = await Promise.all([
        fetchLeads(prof.company_id),
        fetchCollabs(prof.company_id),
      ]);
      setLeads(dbLeads);
      setCollabs(dbCollabs);
      setPage(prof.cargo === "admin" ? "dashboard" : "leads");
      setView("app");
      fetchPlatformLeadsTotal().then(setPlatformTotal);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      alert("Não foi possível carregar seus dados. Tente novamente.");
    }
    setLoadingData(false);
  };

  const prevLeadsRef = useRef(null);

  // Sincroniza automaticamente qualquer mudança nos leads com o Supabase
  useEffect(() => {
    if (!profile || loadingData || role === "master") return;
    if (prevLeadsRef.current === null) { prevLeadsRef.current = leads; return; } // pula a carga inicial
    const prev = prevLeadsRef.current;
    const prevMap = new Map(prev.map(l => [l.id, l]));
    const currIds = new Set(leads.map(l => l.id));
    const isTemp = (id) => typeof id === "number" && id > 1e12;

    const toInsert = leads.filter(l => isTemp(l.id));
    const toUpdate = leads.filter(l => !isTemp(l.id) && prevMap.has(l.id) && JSON.stringify(prevMap.get(l.id)) !== JSON.stringify(l));
    const toDelete = prev.filter(l => !currIds.has(l.id) && !isTemp(l.id));

    (async () => {
      if (toInsert.length) {
        const inserted = await insertLeads(profile.company_id, toInsert);
        setLeads(current => {
          let result = [...current];
          toInsert.forEach((tempLead, idx) => {
            const real = inserted[idx];
            if (real) result = result.map(l => l.id === tempLead.id ? real : l);
          });
          return result;
        });
      }
      for (const l of toUpdate) await updateLeadDb(l.id, l);
      if (toDelete.length) await deleteLeadsDb(toDelete.map(l => l.id));
    })();

    prevLeadsRef.current = leads;
  }, [leads, profile, loadingData, role]);

  if (view === "landing") return <LandingPage onLogin={() => setView("login")} />;

  if (blocked) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, background: C.bg, padding: 20 }}>
      <div style={{ ...sCard, maxWidth: 420, padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M4.9 4.9l14.2 14.2" /></svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Acesso bloqueado</div>
        <div style={{ fontSize: 13, color: C.textSec, marginBottom: 20 }}>{blockedReason || "Sua conta está temporariamente bloqueada. Entre em contato com o suporte da Meetrix para regularizar o acesso."}</div>
        <button onClick={() => { setBlocked(false); setBlockedReason(""); setView("landing"); setCurrentUser(null); }} style={{ ...sBtn(), width: "100%" }}>Voltar</button>
      </div>
    </div>
  );

  if (view === "login") return (
    <AuthPage
      onBack={() => setView("landing")}
      onLoginSuccess={handleLoginSuccess}
      onMasterSuccess={() => { setCurrentUser({ email: MASTER_EMAIL }); setRole("master"); setPage("master"); setView("app"); reloadMasterData(); }}
    />
  );

  if (loadingData) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontSize: 13, color: C.textSec }}>
      Carregando seus dados...
    </div>
  );

  const cargo = profile?.cargo || "admin";


  // Permissões por cargo: quais páginas cada tipo de colaborador pode ver
  const PERMISSIONS = {
    admin: ["dashboard", "leads", "funil", "negociações", "equipe", "pincelab", "whatsapp", "chat", "notícias", "pagamentos", "ajuda", "settings"],
    gestor: ["dashboard", "leads", "funil", "negociações", "equipe", "pincelab", "whatsapp", "chat", "ajuda", "settings"],
    sdr: ["dashboard", "leads", "funil", "pincelab", "chat", "ajuda", "settings"],
    bdr: ["dashboard", "leads", "funil", "pincelab", "chat", "ajuda", "settings"],
    closer: ["dashboard", "leads", "funil", "negociações", "pincelab", "chat", "ajuda", "settings"],
  };

  const allMenuItems = [
    { id: "dashboard", label: "Dashboard" }, { id: "leads", label: "Leads" }, { id: "funil", label: "Funil de Vendas" },
    { id: "negociações", label: "Negociações" }, { id: "equipe", label: "Equipe" }, { id: "pincelab", label: "PincelAb" }, { id: "whatsapp", label: "WhatsApp" },
    { id: "chat", label: "Chat Interno" }, { id: "notícias", label: "Notícias" }, { id: "pagamentos", label: "Pagamentos" },
    { id: "ajuda", label: "Ajuda" }, { id: "settings", label: "Configurações" },
  ];

  const menuItems = role === "master"
    ? [{ id: "master", label: "Painel Master" }, { id: "leads", label: "Leads" }, { id: "negociações", label: "Negociações" }, { id: "settings", label: "Configurações" }]
    : allMenuItems.filter(m => (PERMISSIONS[cargo] || PERMISSIONS.admin).includes(m.id));

  // Colaboradores (sdr/bdr) veem só os leads atribuídos a eles
  const visibleLeads = (role === "colaborador" && (cargo === "sdr" || cargo === "bdr"))
    ? leads.filter(l => l.responsavel === profile?.nome)
    : leads;

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: font, fontSize: 12, color: C.text, background: C.bg }}>
      {/* Sidebar */}
      <div style={{ width: collapsed ? 60 : 220, background: C.sidebar, color: "#fff", display: "flex", flexDirection: "column", transition: "width .2s", flexShrink: 0 }}>
        <div style={{ padding: collapsed ? "18px 10px" : "18px 16px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(255,255,255,.12)" }}>
          {collapsed
            ? <span style={{ fontWeight: 800, fontSize: 18 }}>M</span>
            : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>MEETRIX</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>|</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: 1, textTransform: "uppercase" }}>Smart Leads</span>
              </div>
            )}
        </div>
        {!collapsed && <div style={{ padding: "14px 16px 4px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 0.8 }}>{role === "master" ? "Master" : "CRM"}</div>}
        <div style={{ flex: 1, paddingTop: collapsed ? 8 : 2, overflowY: "auto" }}>
          {menuItems.map(item => {
            const active = page === item.id;
            return (
              <div key={item.id} onClick={() => setPage(item.id)}
                style={{ padding: collapsed ? "10px 0" : "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400,
                  background: active ? "rgba(255,255,255,.12)" : "transparent", borderLeft: active ? "3px solid #fff" : "3px solid transparent",
                  display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start", transition: "all .12s", whiteSpace: "nowrap" }}>
                <MenuIcon id={item.id} />
                {!collapsed && <span>{item.label}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.12)" }}>
          <div onClick={() => { setView("landing"); setShowSupport(false); }} style={{ cursor: "pointer", fontSize: 12, opacity: 0.65, display: "flex", alignItems: "center", gap: 8, justifyContent: collapsed ? "center" : "flex-start" }}>
            <MenuIcon id="sair" />{!collapsed && "Sair"}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textSec, fontFamily: font }}>{collapsed ? "›" : "‹"}</button>
            <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>{menuItems.find(m => m.id === page)?.label}</span>
          </div>
          <div style={{ flex: 1, maxWidth: 380 }}>
            <input
              placeholder="Buscar empresa, CNPJ, nome..."
              onKeyDown={e => { if (e.key === "Enter" && role !== "master") { setPage("leads"); setGlobalSearch(e.target.value); } }}
              onChange={e => setGlobalSearch(e.target.value)}
              style={{ ...sInput, width: "100%", background: C.bg, border: `1px solid ${C.border}` }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {role !== "master" && <button onClick={() => setShowSupport(!showSupport)} style={{ ...sBtn(C.bg, C.accent), border: `1px solid ${C.border}`, padding: "6px 14px", fontSize: 11 }}>Suporte</button>}
            <div style={{ position: "relative" }}>
              <div onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ cursor: "pointer", width: 32, height: 32, borderRadius: "50%", background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `2px solid ${C.accent}` }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{(profile?.nome || currentUser?.email || "?").slice(0, 2).toUpperCase()}</span>}
              </div>
              {showProfileMenu && (
                <div style={{ position: "absolute", top: 40, right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", width: 220, zIndex: 50, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{profile?.nome || "Usuário"}</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>{currentUser?.email}</div>
                  </div>
                  <div onClick={() => { setPage("settings"); setShowProfileMenu(false); }} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 12 }}>Meu perfil</div>
                  <div onClick={() => { setPage("settings"); setShowProfileMenu(false); }} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 12 }}>Configurações</div>
                  <div onClick={() => { setView("landing"); setShowSupport(false); }} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 12, color: C.red, borderTop: `1px solid ${C.border}` }}>Sair</div>
                </div>
              )}
            </div>
            <Badge bg={role === "master" ? C.orangeLight : C.accentLight} color={role === "master" ? C.orange : C.accent}>{role === "master" ? "Master" : "Admin"}</Badge>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {page === "dashboard" && <DashboardPage leads={visibleLeads} collabs={collabs} />}
          {page === "leads" && <LeadsPage leads={visibleLeads} setLeads={setLeads} collabs={collabs} isMaster={role === "master"} companyId={profile?.company_id} empresaNome={profile?.nome} userEmail={currentUser?.email} initialSearch={globalSearch} masterCompanies={masterCompanies} onImportMaster={reloadMasterData} onDistributeMaster={reloadMasterData} onClearMaster={reloadMasterData} platformTotal={platformTotal} realPoolTotal={poolCount} />}
          {page === "funil" && <FunnelPage leads={visibleLeads} setLeads={setLeads} collabs={collabs} />}
          {page === "pincelab" && <PincelabPage companyId={profile?.company_id} />}
          {page === "negociações" && <NegociaçõesPage leads={visibleLeads} setLeads={setLeads} collabs={collabs} />}
          {page === "equipe" && <TeamPage collabs={collabs} setCollabs={setCollabs} leads={leads} companyId={profile?.company_id} />}
          {page === "chat" && <ChatPage collabs={collabs} companyId={profile?.company_id} currentUser={currentUser} profile={profile} onProfileUpdate={setProfile} />}
          {page === "whatsapp" && <ManutencaoPage nome="WhatsApp" />}
          {page === "notícias" && <ManutencaoPage nome="Notícias" />}
          {page === "pagamentos" && <ManutencaoPage nome="Pagamentos" />}
          {page === "ajuda" && <HelpPage />}
          {page === "settings" && <SettingsPage profile={profile} currentUser={currentUser} onProfileUpdate={setProfile} />}
          {page === "master" && <MasterPanel companies={masterCompanies} poolCount={poolCount} loading={loadingMaster} onUpdateLimit={async (companyId, limit) => { await updateCompanyLeadsLimit(companyId, limit); await reloadMasterData(); }} onToggleStatus={async (companyId, status, reason) => { await toggleCompanyStatus(companyId, status, reason); await reloadMasterData(); }} onDeleteCompany={async (companyId) => { await deleteCompanyMaster(companyId); await reloadMasterData(); }} />}
        </div>
      </div>
      <SupportChat show={showSupport} onClose={() => setShowSupport(false)} userEmail={currentUser?.email} companyId={profile?.company_id} />
    </div>
  );
}
