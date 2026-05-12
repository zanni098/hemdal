-- Contacts / Newsletter table
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  message text not null default '',
  type text not null default 'contact',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.contacts enable row level security;

-- Allow inserts from anon (public newsletter/contact forms)
create policy "Allow public inserts" on public.contacts
  for insert to anon with check (true);

-- Only allow authenticated users to read
create policy "Allow authenticated reads" on public.contacts
  for select to authenticated using (true);
