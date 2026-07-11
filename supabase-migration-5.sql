-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO 5: Bloquear/desbloquear clientes + exclusão de clientes
-- Rode este arquivo no SQL Editor do Supabase.
-- ═══════════════════════════════════════════════════════

alter table companies add column if not exists status text default 'ativo'; -- 'ativo' | 'bloqueado'

-- Reforça a segurança: mesmo que alguém tente acessar direto pelo navegador
-- (sem passar pela tela do sistema), uma empresa bloqueada não consegue mais
-- ler nem gravar nenhum lead. Isso substitui as regras antigas de leads.
drop policy if exists "leads_select" on leads;
drop policy if exists "leads_insert" on leads;
drop policy if exists "leads_update" on leads;
drop policy if exists "leads_delete" on leads;

create policy "leads_select" on leads for select
  using (company_id in (
    select p.company_id from profiles p join companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'ativo'
  ));

create policy "leads_insert" on leads for insert
  with check (company_id in (
    select p.company_id from profiles p join companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'ativo'
  ));

create policy "leads_update" on leads for update
  using (company_id in (
    select p.company_id from profiles p join companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'ativo'
  ));

create policy "leads_delete" on leads for delete
  using (company_id in (
    select p.company_id from profiles p join companies c on c.id = p.company_id
    where p.id = auth.uid() and c.status = 'ativo'
  ));

-- A conta Master usa a chave de serviço (bypassa RLS), então continua
-- funcionando normalmente mesmo com essas regras mais rígidas.
