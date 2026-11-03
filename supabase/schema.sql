-- ===========================================================================
-- Radar IA · esquema en Supabase
-- Pegar completo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
--
-- Tablas:
--   radar_industries, radar_activities, radar_questions  catálogo (todas las industrias)
--   diagnoses                                            empresa, contacto y resultado
--   diagnosis_answers                                    una fila por pregunta respondida
--   diagnosis_goals                                      objetivos marcados
--   diagnoses_backup                                     copia al reiniciar la base
--
-- No hay una tabla por sector: industry_id filtra alimentos, moda, salud, etc.
-- El código RAD-… es el identificador público de la solución (/s/RAD-XXXXXX).
--
-- Seguridad: RLS activado y SIN políticas. Con la llave pública (anon)
-- nadie puede leer ni escribir; solo el servidor, con la llave secreta
-- (SUPABASE_SECRET_KEY).
-- ===========================================================================

create table if not exists public.radar_industries (
  id        text primary key,
  label     text not null,
  template  text not null
);

create table if not exists public.radar_activities (
  id           text primary key,
  industry_id  text not null references public.radar_industries (id),
  label        text not null,
  link         text not null
);

create index if not exists radar_activities_industry on public.radar_activities (industry_id);

create table if not exists public.radar_questions (
  id           text primary key,
  industry_id  text references public.radar_industries (id),
  link         text,
  scope        text not null check (scope in ('industria', 'eslabon', 'transversal')),
  dimension    text not null,
  section      text not null,
  prompt       text not null,
  option_a     text not null,
  option_b     text not null,
  option_c     text not null,
  option_d     text not null
);

create index if not exists radar_questions_industry on public.radar_questions (industry_id);

create table if not exists public.diagnoses (
  id               text primary key,
  code             text not null unique,
  edit_token_hash  text not null,
  company_name     text not null,
  city             text not null default '',
  contact_name     text not null default '',
  email            text not null default '',
  phone            text not null default '',
  contact_phone    text not null default '',
  industry         text not null,
  activity         text not null,
  industry_id      text not null default '',
  activity_id      text not null default '',
  index_score      integer not null check (index_score between 0 and 100),
  level            text not null check (level in ('alto', 'moderado', 'bajo')),
  central_problem  text not null default '',
  presentation_mode text not null default '',
  presentation_kind text not null default '',
  presentation_action text not null default '',
  -- JSON { "mode": "catalogo"|"guia", "spec": { "action": ... } }. Vacío hasta «Creando la solución».
  solution_spec    text not null default '',
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
create index if not exists diagnoses_industry on public.diagnoses (industry_id, activity_id);

alter table public.diagnoses add column if not exists industry_id text not null default '';
alter table public.diagnoses add column if not exists activity_id text not null default '';
alter table public.diagnoses add column if not exists contact_phone text not null default '';

create table if not exists public.diagnosis_answers (
  diagnosis_id  text not null references public.diagnoses (id) on delete cascade,
  question_id   text not null,
  industry_id   text not null default '',
  option_key    text not null check (option_key in ('A', 'B', 'C', 'D', 'E')),
  points        integer not null,
  prompt        text not null default '',
  primary key (diagnosis_id, question_id)
);

create index if not exists diagnosis_answers_question on public.diagnosis_answers (question_id, industry_id);

create table if not exists public.diagnosis_goals (
  diagnosis_id  text not null references public.diagnoses (id) on delete cascade,
  goal_id       text not null,
  primary key (diagnosis_id, goal_id)
);

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
  contact_phone    text not null default '',
  industry         text not null,
  activity         text not null,
  industry_id      text not null default '',
  activity_id      text not null default '',
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

alter table public.diagnoses_backup add column if not exists industry_id text not null default '';
alter table public.diagnoses_backup add column if not exists activity_id text not null default '';
alter table public.diagnoses_backup add column if not exists contact_phone text not null default '';

alter table public.diagnoses add column if not exists presentation_mode text not null default '';
alter table public.diagnoses add column if not exists presentation_kind text not null default '';
alter table public.diagnoses add column if not exists presentation_action text not null default '';
alter table public.diagnoses add column if not exists solution_spec text not null default '';

create index if not exists diagnoses_backup_batch on public.diagnoses_backup (backup_batch);

alter table public.diagnoses enable row level security;
alter table public.diagnoses_backup enable row level security;
alter table public.radar_industries enable row level security;
alter table public.radar_activities enable row level security;
alter table public.radar_questions enable row level security;
alter table public.diagnosis_answers enable row level security;
alter table public.diagnosis_goals enable row level security;
