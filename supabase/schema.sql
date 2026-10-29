-- =========================================================
-- Moka Coloriages — base de données Supabase
-- À coller dans Supabase > SQL Editor > New query, puis « Run ».
-- Aucune donnée d'enfant identifiante : seulement une tranche d'âge.
-- =========================================================

-- ---------- Profils (un par compte parent) ----------
create table if not exists public.profils (
  id uuid primary key references auth.users on delete cascade,
  prenom text,
  created_at timestamptz not null default now()
);

-- Crée le profil automatiquement à l'inscription (le prénom vient du formulaire)
create or replace function public.creer_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profils (id, prenom) values (new.id, new.raw_user_meta_data ->> 'prenom')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists a_l_inscription on auth.users;
create trigger a_l_inscription after insert on auth.users
  for each row execute function public.creer_profil();

-- ---------- Enfants : tranche d'âge seulement ----------
create table if not exists public.enfants (
  id bigint generated always as identity primary key,
  parent_id uuid not null references auth.users on delete cascade,
  tranche_age text not null check (tranche_age in ('2-4', '4-6', '6-8')),
  created_at timestamptz not null default now()
);

-- ---------- Commandes et achats (écrits uniquement par le webhook Stripe) ----------
create table if not exists public.commandes (
  id bigint generated always as identity primary key,
  stripe_session_id text not null unique,
  numero text not null,
  email text not null,
  user_id uuid references auth.users on delete set null,
  total_cents integer not null,
  articles text[] not null default '{}',
  renonciation_retractation boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.achats (
  id bigint generated always as identity primary key,
  commande_id bigint not null references public.commandes on delete cascade,
  pack_id text not null,
  email text not null,
  user_id uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique (commande_id, pack_id)
);
create index if not exists achats_email on public.achats (lower(email));
create index if not exists achats_user on public.achats (user_id);

-- ---------- Envies (cahiers mis de côté par le parent) ----------
create table if not exists public.envies (
  user_id uuid not null references auth.users on delete cascade,
  pack_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, pack_id)
);

-- ---------- Newsletter (coloriage offert) ----------
create table if not exists public.newsletter (
  id bigint generated always as identity primary key,
  email text not null unique,
  consentement boolean not null default false,  -- « nouvelles aventures », coché ou non
  source text,
  created_at timestamptz not null default now()
);

-- ---------- Messages du formulaire de contact ----------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  prenom text not null,
  email text not null,
  sujet text,
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

-- ---------- Vote de la prochaine aventure ----------
create table if not exists public.votes (
  user_id uuid primary key references auth.users on delete cascade,
  choix text not null check (choix in ('pompiers', 'cirque', 'zoo')),
  created_at timestamptz not null default now()
);

-- Résultats agrégés (personne ne voit le vote des autres, seulement les totaux)
create or replace view public.resultats_vote as
  select choix, count(*)::int as nb from public.votes group by choix;
grant select on public.resultats_vote to anon, authenticated;

-- =========================================================
-- Règles d'accès (RLS)
-- =========================================================
alter table public.profils    enable row level security;
alter table public.enfants    enable row level security;
alter table public.commandes  enable row level security;
alter table public.achats     enable row level security;
alter table public.envies     enable row level security;
alter table public.newsletter enable row level security;
alter table public.messages   enable row level security;
alter table public.votes      enable row level security;

-- Profil : chacun le sien
drop policy if exists "profil: lire le sien" on public.profils;
create policy "profil: lire le sien" on public.profils for select using (id = auth.uid());
drop policy if exists "profil: modifier le sien" on public.profils;
create policy "profil: modifier le sien" on public.profils for update using (id = auth.uid());

-- Enfants : le parent gère les siens
drop policy if exists "enfants: les miens" on public.enfants;
create policy "enfants: les miens" on public.enfants for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- Commandes et achats : lecture seule, par compte ou par email (achat fait avant de créer le compte)
drop policy if exists "commandes: les miennes" on public.commandes;
create policy "commandes: les miennes" on public.commandes for select
  using (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'));
drop policy if exists "achats: les miens" on public.achats;
create policy "achats: les miens" on public.achats for select
  using (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'));

-- Envies : les miennes
drop policy if exists "envies: les miennes" on public.envies;
create policy "envies: les miennes" on public.envies for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Newsletter et messages : tout le monde peut écrire, personne ne peut lire depuis le site
drop policy if exists "newsletter: s'inscrire" on public.newsletter;
create policy "newsletter: s'inscrire" on public.newsletter for insert to anon, authenticated with check (true);
drop policy if exists "messages: écrire" on public.messages;
create policy "messages: écrire" on public.messages for insert to anon, authenticated with check (true);

-- Votes : un vote par compte, modifiable
drop policy if exists "votes: le mien" on public.votes;
create policy "votes: le mien" on public.votes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- Stockage PRIVÉ des PDF (bucket « pdfs »)
-- Aucune règle d'accès : seul le serveur (clé service_role) peut créer un lien temporaire.
-- Fichiers attendus : montagne.pdf, plage.pdf, foret.pdf, ferme.pdf, ecole.pdf,
--                     noel.pdf, espace.pdf, docteur.pdf, coffret.pdf
-- =========================================================
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;
