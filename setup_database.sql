-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Table: leads
create table if not exists public.leads (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    company text,
    email text,
    phone text,
    status text,
    estimated_value numeric,
    origin text,
    responsible text,
    observations text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    interactions jsonb default '[]'::jsonb
);

-- Table: users (Custom user table used by some services)
create table if not exists public.users (
    id uuid primary key references auth.users(id),
    name text,
    email text,
    role text,
    phone text,
    status text,
    is_admin boolean default false,
    password text -- Note: storing password here is not recommended if using auth.users
);

-- Table: profiles (Used by admin-create-user function)
create table if not exists public.profiles (
    user_id uuid primary key references auth.users(id),
    full_name text,
    role text,
    approved boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: projects
create table if not exists public.projects (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: boards
create table if not exists public.boards (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references public.projects(id) on delete cascade,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: board_columns
create table if not exists public.board_columns (
    id uuid primary key default uuid_generate_v4(),
    board_id uuid references public.boards(id) on delete cascade,
    name text not null,
    color text,
    position integer default 0
);

-- Table: tasks
create table if not exists public.tasks (
    id uuid primary key default uuid_generate_v4(),
    column_id uuid references public.board_columns(id) on delete cascade,
    title text not null,
    description text,
    position integer default 0,
    priority text check (priority in ('low', 'medium', 'high')),
    due_date timestamp with time zone,
    completed boolean default false,
    assigned_to uuid references auth.users(id),
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: task_checklist_items
create table if not exists public.task_checklist_items (
    id uuid primary key default uuid_generate_v4(),
    task_id uuid references public.tasks(id) on delete cascade,
    text text not null,
    completed boolean default false,
    position integer default 0
);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
alter table public.leads enable row level security;
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;

-- Create policies (permissive for now, can be tightened later)
create policy "Enable all access for authenticated users" on public.leads for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.users for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.profiles for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.projects for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.boards for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.board_columns for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.tasks for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.task_checklist_items for all using (auth.role() = 'authenticated');

-- Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role, approved)
  values (new.id, new.raw_user_meta_data->>'full_name', 'client', true);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
