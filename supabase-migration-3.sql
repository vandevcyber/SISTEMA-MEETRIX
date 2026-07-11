-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO 3: Estoque de leads do Master + total da plataforma
-- Rode este arquivo no SQL Editor do Supabase (Master já configurado antes).
-- ═══════════════════════════════════════════════════════

-- Permite leads "no estoque" (ainda não distribuídos a nenhum cliente):
-- company_id fica NULL até o Master atribuir a um cliente.
alter table leads alter column company_id drop not null;

-- Função que devolve só a CONTAGEM total de leads da plataforma inteira
-- (estoque do Master + todos os clientes somados). Não expõe nenhum dado,
-- só o número — por isso é seguro liberar para qualquer usuário logado.
create or replace function get_platform_leads_total()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from leads;
$$;

grant execute on function get_platform_leads_total() to authenticated;
