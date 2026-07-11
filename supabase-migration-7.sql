-- ═══════════════════════════════════════════════════════
-- MIGRAÇÃO 7: PincelAb — largura de colunas e formatação de fonte
-- Rode este arquivo no SQL Editor do Supabase.
-- ═══════════════════════════════════════════════════════

alter table pincelab_sheets add column if not exists col_widths jsonb default '[]';
alter table pincelab_sheets add column if not exists styles jsonb default '{}';
