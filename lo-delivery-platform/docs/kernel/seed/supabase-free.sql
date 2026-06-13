-- 可选：Supabase 免费项目 SQL Editor 执行一次
-- 然后在页面设置 window.LOT_CHAIN = { supabaseUrl, supabaseAnonKey }

create table if not exists lot_los (
  lo_id text primary key,
  channel text not null,
  status text not null,
  spatial_path jsonb not null,
  origin_cell_id text,
  dest_cell_id text,
  primary_actor text,
  contract jsonb,
  links jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lot_events (
  id bigserial primary key,
  lo_id text not null references lot_los(lo_id) on delete cascade,
  seq int not null,
  type text not null,
  code text not null,
  actor text,
  spatial_cell_id text,
  payload jsonb,
  ts timestamptz not null,
  prev_hash text not null,
  hash text not null,
  unique (lo_id, seq)
);

alter table lot_los enable row level security;
alter table lot_events enable row level security;
create policy "anon read los" on lot_los for select using (true);
create policy "anon insert los" on lot_los for insert with check (true);
create policy "anon update los" on lot_los for update using (true) with check (true);
create policy "anon read events" on lot_events for select using (true);
create policy "anon insert events" on lot_events for insert with check (true);
create policy "anon update events" on lot_events for update using (true) with check (true);
