create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null
);

create table if not exists parents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz default now()
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  birth_date date,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  title text not null,
  event_date date not null,
  event_type text not null,
  child_id uuid references children(id) on delete set null,
  parent_id uuid references parents(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  expense_date date not null,
  category text not null,
  amount numeric not null,
  paid_by_id uuid references parents(id) on delete set null,
  status text not null,
  receipt_url text,
  note text,
  created_at timestamptz default now()
);

create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  child_id uuid references children(id) on delete set null,
  subject text not null,
  due_date date not null,
  status text not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  author_id uuid references parents(id) on delete set null,
  child_id uuid references children(id) on delete set null,
  entry_date date not null,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  author_id uuid references parents(id) on delete set null,
  text text not null,
  created_at timestamptz default now()
);
