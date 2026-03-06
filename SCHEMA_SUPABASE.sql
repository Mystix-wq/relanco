-- COLLE CE CODE DANS : Supabase → SQL Editor → New query → Run

-- Table profils agents
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  agency_name text,
  email text,
  subscription_status text default 'trial',
  stripe_customer_id text,
  created_at timestamp with time zone default now()
);

-- Table acheteurs
create table if not exists buyers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  budget integer default 0,
  min_surface integer default 0,
  max_surface integer default 0,
  rooms integer default 3,
  zones text[] default '{}',
  source text default 'Autre',
  status text default 'warm',
  notes text default '',
  created_at timestamp with time zone default now()
);

-- Table visites
create table if not exists visits (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references buyers on delete cascade not null,
  date date not null,
  address text not null,
  ref text default '',
  price integer default 0,
  surface integer default 0,
  rooms integer default 3,
  reaction text default 'neutral',
  notes text default '',
  followup_sent boolean default false,
  created_at timestamp with time zone default now()
);

-- Sécurité : chaque agent voit uniquement ses propres données
alter table profiles enable row level security;
alter table buyers enable row level security;
alter table visits enable row level security;

create policy "Profil personnel" on profiles for all using (auth.uid() = id);
create policy "Acheteurs personnels" on buyers for all using (auth.uid() = user_id);
create policy "Visites personnelles" on visits for all using (
  buyer_id in (select id from buyers where user_id = auth.uid())
);

-- Créer un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
