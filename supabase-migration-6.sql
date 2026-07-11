-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO 6: PincelAb — planilha livre dentro do sistema
-- Rode este arquivo no SQL Editor do Supabase.
-- ═══════════════════════════════════════════════════════

create table if not exists pincelab_sheets (
  id bigint generated always as identity primary key,
  company_id uuid references companies(id) on delete cascade unique,
  columns jsonb default '["Coluna A","Coluna B","Coluna C","Coluna D"]',
  rows jsonb default '[]',
  updated_at timestamptz default now()
);

alter table pincelab_sheets enable row level security;

create policy "pincelab_select" on pincelab_sheets for select
  using (company_id in (
    select p.company_id from profiles p join companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'ativo'
  ));

create policy "pincelab_insert" on pincelab_sheets for insert
  with check (company_id in (
    select p.company_id from profiles p join companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'ativo'
  ));

create policy "pincelab_update" on pincelab_sheets for update
  using (company_id in (
    select p.company_id from profiles p join companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'ativo'
  ));
