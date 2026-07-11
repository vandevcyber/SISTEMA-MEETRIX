-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO 4: Novos campos do lead, status "Lead novo",
-- e correção do chat de suporte (privacidade entre clientes)
-- Rode este arquivo no SQL Editor do Supabase.
-- ═══════════════════════════════════════════════════════

-- Novos campos no lead
alter table leads add column if not exists bairro text;
alter table leads add column if not exists funcionarios text; -- qtd média de funcionários

-- Status inicial correto: "Lead novo" (nunca foi contactado)
alter table leads alter column status set default 'Lead novo';
update leads set status = 'Lead novo' where status = 'Não contactado';

-- ═══════════════════════════════════════════════════════
-- CHAT DE SUPORTE: agora por empresa, com resposta do Master,
-- e SEM vazar mensagens de um cliente para outro.
-- ═══════════════════════════════════════════════════════

alter table support_messages add column if not exists company_id uuid references companies(id) on delete cascade;
alter table support_messages add column if not exists remetente text default 'cliente'; -- 'cliente' | 'master'
alter table support_messages add column if not exists lida boolean default false;

-- Remove as regras antigas (que deixavam qualquer pessoa ler as mensagens de qualquer empresa)
drop policy if exists "support_insert" on support_messages;
drop policy if exists "support_select" on support_messages;

-- Cliente só pode inserir e ler mensagens da PRÓPRIA empresa
create policy "support_insert_own_company" on support_messages for insert
  with check (company_id in (select company_id from profiles where profiles.id = auth.uid()));

create policy "support_select_own_company" on support_messages for select
  using (company_id in (select company_id from profiles where profiles.id = auth.uid()));

-- A conta Master não passa pela autenticação do Supabase, então ela acessa
-- todas as empresas através de uma função de servidor (pasta /api), usando
-- a chave de serviço — que ignora essas regras de RLS por padrão.
