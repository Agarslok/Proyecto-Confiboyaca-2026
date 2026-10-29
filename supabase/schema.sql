-- ===========================================================================
-- Radar IA · esquema en Supabase
-- Pegar completo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
--
-- Seguridad: RLS activado y SIN políticas. Así, con la llave pública (anon)
-- nadie puede leer ni escribir; solo el servidor, con la llave secreta
-- (SUPABASE_SECRET_KEY), que va únicamente en las variables de Netlify.
-- ===========================================================================

create table if not exists public.diagnoses (
  id               text primary key,
  code             text not null unique,
  edit_token_hash  text not null,
  company_name     text not null,
  city             text not null default '',
  contact_name     text not null default '',
  email            text not null default '',
  phone            text not null default '',
  industry         text not null,
  activity         text not null,
  index_score      integer not null check (index_score between 0 and 100),
  level            text not null check (level in ('alto', 'moderado', 'bajo')),
  central_problem  text not null default '',
  answers_json     text not null,
  status           text not null default 'nuevo'
                   check (status in ('nuevo', 'interesado', 'contactado', 'visita', 'acompanamiento', 'cerrado', 'descartado')),
  notes            text not null default '',
  interest_at      timestamptz,
  consent_at       timestamptz not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists diagnoses_updated on public.diagnoses (updated_at desc);
create index if not exists diagnoses_status on public.diagnoses (status);
create index if not exists diagnoses_company on public.diagnoses (company_name);

-- Copias que se guardan al usar «Reiniciar la base» en el panel.
create table if not exists public.diagnoses_backup (
  backup_id        text primary key,
  backup_batch     text not null,
  backed_up_at     timestamptz not null default now(),
  id               text not null,
  code             text not null,
  edit_token_hash  text not null,
  company_name     text not null,
  city             text not null default '',
  contact_name     text not null default '',
  email            text not null default '',
  phone            text not null default '',
  industry         text not null,
  activity         text not null,
  index_score      integer not null,
  level            text not null,
  central_problem  text not null default '',
  answers_json     text not null,
  status           text not null default 'nuevo',
  notes            text not null default '',
  interest_at      timestamptz,
  consent_at       timestamptz not null,
  created_at       timestamptz not null,
  updated_at       timestamptz not null
);

create index if not exists diagnoses_backup_batch on public.diagnoses_backup (backup_batch);

alter table public.diagnoses enable row level security;
alter table public.diagnoses_backup enable row level security;
