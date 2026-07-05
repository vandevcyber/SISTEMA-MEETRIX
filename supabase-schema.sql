-- ═══════════════════════════════════════════════════════
-- MEETRIX — Schema completo do banco de dados
-- Rode este código inteiro no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════

-- Tabela de empresas (cada cliente que se cadastra vira uma empresa)
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id),
  plano text default 'basic',
  leads_limit integer default 15000,
  created_at timestamptz default now()
);

-- Tabela de perfis (cada pessoa que faz login: admin ou colaborador)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  nome text,
  email text,
  cargo text default 'admin', -- admin, gestor, sdr, bdr, closer
  limite_leads integer,
  created_at timestamptz default now()
);

-- Tabela de leads
create table leads (
  id bigint generated always as identity primary key,
  company_id uuid references companies(id) on delete cascade,
  empresa text,
  nome text,
  cnpj text,
  email text,
  tel1 text,
  tel2 text,
  socio text,
  cidade text,
  estado text,
  divida text,
  divida_ativa text,
  cnae text,
  segmento text,
  faturamento text,
  abertura text,
  tributacao text,
  rede_social text,
  etapa text default 'novo',
  status text default 'Não contactado',
  responsavel text,
  respondeu text,
  reuniao text,
  obs text,
  valor_neg numeric default 0,
  produto text,
  created_at timestamptz default now()
);

-- Tabela de mensagens de suporte (Master vê tudo)
create table support_messages (
  id bigint generated always as identity primary key,
  sender_email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════
-- SEGURANÇA (Row Level Security)
-- Cada empresa só vê os próprios dados
-- ═══════════════════════════════════════════════════════

alter table companies enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table support_messages enable row level security;

-- Companies: só quem já tem perfil vinculado pode ver a própria empresa
create policy "companies_select" on companies for select
  using (id in (select company_id from profiles where profiles.id = auth.uid()));

create policy "companies_insert" on companies for insert
  with check (true); -- necessário para o primeiro cadastro (criação da empresa)

-- Profiles: só vê perfis da própria empresa
create policy "profiles_select" on profiles for select
  using (company_id in (select company_id from profiles p2 where p2.id = auth.uid()) or id = auth.uid());

create policy "profiles_insert" on profiles for insert
  with check (true); -- necessário para o primeiro cadastro e convite de colaboradores

create policy "profiles_update" on profiles for update
  using (id = auth.uid());

create policy "profiles_delete" on profiles for delete
  using (company_id in (select company_id from profiles p2 where p2.id = auth.uid() and p2.cargo = 'admin'));

-- Leads: só vê e mexe nos leads da própria empresa
create policy "leads_select" on leads for select
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));

create policy "leads_insert" on leads for insert
  with check (company_id in (select company_id from profiles where profiles.id = auth.uid()));

create policy "leads_update" on leads for update
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));

create policy "leads_delete" on leads for delete
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));

-- Support messages: qualquer usuário logado pode enviar; a leitura é feita pela conta Master
-- (a conta Master não passa pelo Supabase Auth, então a leitura usa a chave anônima sem RLS restritiva aqui)
create policy "support_insert" on support_messages for insert
  with check (true);

create policy "support_select" on support_messages for select
  using (true);

-- ═══════════════════════════════════════════════════════
-- CHAT INTERNO: grupos, mensagens, foto de perfil e fundo
-- ═══════════════════════════════════════════════════════

-- Foto de perfil e imagem de fundo do chat, por usuário
alter table profiles add column avatar_url text;
alter table profiles add column chat_background_url text;

-- Grupos do chat interno (visíveis para todos da mesma empresa)
create table chat_groups (
  id bigint generated always as identity primary key,
  company_id uuid references companies(id) on delete cascade,
  nome text not null,
  membros text[] default '{}',
  created_at timestamptz default now()
);

alter table chat_groups enable row level security;

create policy "groups_select" on chat_groups for select
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));
create policy "groups_insert" on chat_groups for insert
  with check (company_id in (select company_id from profiles where profiles.id = auth.uid()));
create policy "groups_update" on chat_groups for update
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));
create policy "groups_delete" on chat_groups for delete
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));

-- Mensagens do chat (texto, imagem, áudio ou figurinha)
create table chat_messages (
  id bigint generated always as identity primary key,
  company_id uuid references companies(id) on delete cascade,
  channel_id text not null, -- ex: 'grupo-1', 'dm-<id1>-<id2>'
  sender_id uuid references auth.users(id),
  sender_nome text,
  tipo text default 'texto', -- texto | imagem | audio | figurinha
  conteudo text, -- texto da mensagem OU url do arquivo
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;

create policy "chat_select" on chat_messages for select
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));
create policy "chat_insert" on chat_messages for insert
  with check (company_id in (select company_id from profiles where profiles.id = auth.uid()));

-- ═══════════════════════════════════════════════════════
-- ARMAZENAMENTO DE ARQUIVOS (fotos, áudios)
-- Depois de rodar tudo acima, vá em Storage → New bucket
-- Nome do bucket: media   |   Marque como "Public bucket"
-- Depois volte aqui e rode o restante abaixo:
-- ═══════════════════════════════════════════════════════

create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');

create policy "media_authenticated_upload" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════
-- LOG DE EXPORTAÇÃO (proteção contra revenda de leads)
-- ═══════════════════════════════════════════════════════

create table export_logs (
  id bigint generated always as identity primary key,
  company_id uuid references companies(id) on delete cascade,
  empresa_nome text,
  user_email text,
  quantidade integer,
  valor numeric,
  codigo text,
  payment_id text,
  created_at timestamptz default now()
);

alter table export_logs enable row level security;

-- Qualquer usuário logado pode registrar sua própria exportação
create policy "export_logs_insert" on export_logs for insert
  with check (true);

-- A leitura é livre aqui porque quem consulta é a conta Master (não passa pelo Supabase Auth)
create policy "export_logs_select" on export_logs for select
  using (true);


