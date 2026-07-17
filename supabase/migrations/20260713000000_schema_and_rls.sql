-- Ensure UUID extension is enabled
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamptz default now(),
  email text not null,
  display_name text,
  created_at timestamptz default now()
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Trigger to create a profile automatically on signup
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Sessions Log Table (Audit Trail)
create table public.sessions_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  session_id uuid, -- refers to the id in auth.sessions
  ip_address text,
  user_agent text,
  location text,
  is_active boolean default true,
  login_status text not null check (login_status in ('success', 'failed')),
  created_at timestamptz default now()
);

-- Enable RLS on Sessions Log
alter table public.sessions_log enable row level security;

-- Policies for Sessions Log
-- Strict security: users can only view their own logs, and cannot insert/update/delete.
-- Insertion and updates are performed server-side using service_role or definer function.
create policy "Users can view their own sessions log" on public.sessions_log
  for select using (auth.uid() = user_id);


-- 3. WebAuthn Credentials Table (Passkeys)
create table public.webauthn_credentials (
  id text primary key, -- Credential ID (base64url)
  user_id uuid references auth.users on delete cascade not null,
  public_key text not null, -- PEM or JWK representation of the key
  counter bigint default 0 not null,
  backed_up boolean default false not null,
  transports text[] default '{}'::text[] not null,
  created_at timestamptz default now()
);

-- Enable RLS on WebAuthn Credentials
alter table public.webauthn_credentials enable row level security;

-- Policies for WebAuthn Credentials
create policy "Users can view their own passkeys" on public.webauthn_credentials
  for select using (auth.uid() = user_id);

create policy "Users can insert their own passkeys" on public.webauthn_credentials
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own passkeys" on public.webauthn_credentials
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own passkeys" on public.webauthn_credentials
  for delete using (auth.uid() = user_id);


-- 4. Backup Codes Table (MFA Recovery)
create table public.backup_codes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  code_hash text not null, -- Salted hash of the backup code
  used boolean default false not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS on Backup Codes
alter table public.backup_codes enable row level security;

-- Policies for Backup Codes
-- Only readable by the owner. Cannot be edited directly by users (server handles marking as used).
create policy "Users can view their own backup codes" on public.backup_codes
  for select using (auth.uid() = user_id);


-- 5. Helper Functions & Triggers

-- Check if MFA is active for a user (queries auth.mfa_factors)
create or replace function public.is_mfa_enabled(target_user_id uuid)
returns boolean
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from auth.mfa_factors
    where user_id = target_user_id and status = 'verified'
  );
end;
$$ language plpgsql;

-- Trigger to automatically invalidate sessions in sessions_log when deleted from auth.sessions
create or replace function public.handle_session_deletion()
returns trigger
security definer
set search_path = public
as $$
begin
  update public.sessions_log
  set is_active = false
  where session_id = old.id;
  return old;
end;
$$ language plpgsql;

create trigger on_session_deleted
  after delete on auth.sessions
  for each row execute function public.handle_session_deletion();

-- RPC function to revoke a session (called by users)
create or replace function public.revoke_session(target_session_id uuid)
returns void
security definer
set search_path = public
as $$
begin
  -- Delete the session from auth.sessions, which forces token invalidation
  delete from auth.sessions
  where id = target_session_id and user_id = auth.uid();
  
  -- Update the audit log immediately
  update public.sessions_log
  set is_active = false
  where session_id = target_session_id and user_id = auth.uid();
end;
$$ language plpgsql;
