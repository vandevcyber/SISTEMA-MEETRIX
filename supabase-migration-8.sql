-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO 8: Motivo do bloqueio + busca de verdade no estoque grande
-- Rode este arquivo no SQL Editor do Supabase.
-- ═══════════════════════════════════════════════════════

alter table companies add column if not exists blocked_reason text;

-- Lista os segmentos e estados que realmente existem no estoque inteiro
-- (não só nos primeiros 1000 carregados) — usado para popular os filtros direito.
create or replace function get_pool_segmentos()
returns table(segmento text)
language sql security definer set search_path = public as $$
  select distinct segmento from leads
  where company_id is null and segmento is not null and segmento <> ''
  order by segmento limit 500;
$$;

create or replace function get_pool_estados()
returns table(estado text)
language sql security definer set search_path = public as $$
  select distinct estado from leads
  where company_id is null and estado is not null and estado <> ''
  order by estado limit 100;
$$;

grant execute on function get_pool_segmentos() to authenticated, anon, service_role;
grant execute on function get_pool_estados() to authenticated, anon, service_role;
