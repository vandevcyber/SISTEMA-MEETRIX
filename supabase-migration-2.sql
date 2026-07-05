-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO: Chat com fotos, áudio e figurinhas
-- Rode este arquivo SE VOCÊ JÁ TINHA RODADO o supabase-schema.sql antes.
-- Se está configurando o banco pela primeira vez, ignore este arquivo —
-- use apenas o supabase-schema.sql, que já inclui tudo.
-- ═══════════════════════════════════════════════════════

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists chat_background_url text;

create table if not exists chat_groups (
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

create table if not exists chat_messages (
  id bigint generated always as identity primary key,
  company_id uuid references companies(id) on delete cascade,
  channel_id text not null,
  sender_id uuid references auth.users(id),
  sender_nome text,
  tipo text default 'texto',
  conteudo text,
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;

create policy "chat_select" on chat_messages for select
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));
create policy "chat_insert" on chat_messages for insert
  with check (company_id in (select company_id from profiles where profiles.id = auth.uid()));

-- Depois de rodar o texto acima, vá em Storage → New bucket
-- Nome: media  |  Marque "Public bucket"  |  Volte aqui e rode abaixo:

create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');

create policy "media_authenticated_upload" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

create table if not exists export_logs (
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

create policy "export_logs_insert" on export_logs for insert
  with check (true);
create policy "export_logs_select" on export_logs for select
  using (true);

