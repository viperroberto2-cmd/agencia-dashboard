-- SQL_TASKS_TABLE.sql
-- Tabla de tareas para Agencia Dashboard / Hermes CRM

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),

  cliente_id text,
  title text not null,
  description text,

  status text not null default 'open',
  priority text not null default 'normal',

  assigned_to text,
  source text default 'manual',

  metadata jsonb default '{}'::jsonb,

  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_cliente_id on public.tasks(cliente_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_created_at on public.tasks(created_at desc);

create or replace function public.set_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on public.tasks;

create trigger trg_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_tasks_updated_at();
