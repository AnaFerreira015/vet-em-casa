
-- Enums
create type public.app_role as enum ('vet','tutor');
create type public.service_type as enum ('consulta','vacina','retorno','pet_sitting');
create type public.appointment_status as enum ('pendente','confirmado','concluido','cancelado','recusado');
create type public.pet_sex as enum ('macho','femea');

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own role read" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 30),
  address text check (char_length(address) <= 200),
  neighborhood text check (char_length(neighborhood) <= 100),
  city text check (char_length(city) <= 100),
  zip text check (char_length(zip) <= 12),
  emergency_contact text check (char_length(emergency_contact) <= 150),
  lgpd_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profile own read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'vet'));
create policy "profile own update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profile vet update" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'vet'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, lgpd_consent_at)
  values (new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name',''),120),
    left(new.raw_user_meta_data->>'phone',30),
    case when (new.raw_user_meta_data->>'lgpd_consent') = 'true' then now() else null end);
  insert into public.user_roles (user_id, role) values (new.id, 'tutor');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Home access (sensitive)
create table public.home_access (
  tutor_id uuid primary key references public.profiles(id) on delete cascade,
  alarm_code text check (char_length(alarm_code) <= 50),
  key_location text check (char_length(key_location) <= 300),
  access_instructions text check (char_length(access_instructions) <= 1000),
  updated_at timestamptz not null default now()
);
grant select on public.home_access to authenticated;
grant all on public.home_access to service_role;
alter table public.home_access enable row level security;
create policy "vet reads home access" on public.home_access for select to authenticated using (public.has_role(auth.uid(),'vet'));

create or replace function public.set_home_access(_alarm text, _key text, _instr text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if char_length(coalesce(_alarm,'')) > 50 or char_length(coalesce(_key,'')) > 300 or char_length(coalesce(_instr,'')) > 1000 then
    raise exception 'campo muito longo'; end if;
  insert into public.home_access (tutor_id, alarm_code, key_location, access_instructions, updated_at)
  values (auth.uid(), nullif(_alarm,''), nullif(_key,''), nullif(_instr,''), now())
  on conflict (tutor_id) do update set alarm_code = excluded.alarm_code, key_location = excluded.key_location,
    access_instructions = excluded.access_instructions, updated_at = now();
end $$;
create or replace function public.clear_home_access() returns void language sql security definer set search_path = public as $$
  delete from public.home_access where tutor_id = auth.uid();
$$;
create or replace function public.my_home_access_updated_at() returns timestamptz language sql stable security definer set search_path = public as $$
  select updated_at from public.home_access where tutor_id = auth.uid();
$$;
revoke execute on function public.set_home_access(text,text,text), public.clear_home_access(), public.my_home_access_updated_at() from public, anon;
grant execute on function public.set_home_access(text,text,text), public.clear_home_access(), public.my_home_access_updated_at() to authenticated;

-- Pets
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  species text not null check (char_length(species) between 1 and 40),
  breed text check (char_length(breed) <= 60),
  sex public.pet_sex,
  birth_date date,
  weight_kg numeric(5,2) check (weight_kg is null or (weight_kg > 0 and weight_kg < 200)),
  photo_path text check (char_length(photo_path) <= 300),
  temperament text check (char_length(temperament) <= 200),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pets to authenticated;
grant all on public.pets to service_role;
alter table public.pets enable row level security;
create policy "pets read" on public.pets for select to authenticated using (tutor_id = auth.uid() or public.has_role(auth.uid(),'vet'));
create policy "pets insert own" on public.pets for insert to authenticated with check (tutor_id = auth.uid());
create policy "pets update" on public.pets for update to authenticated using (tutor_id = auth.uid() or public.has_role(auth.uid(),'vet')) with check (tutor_id = auth.uid() or public.has_role(auth.uid(),'vet'));
create policy "pets delete own" on public.pets for delete to authenticated using (tutor_id = auth.uid());

create or replace function public.validate_pet() returns trigger language plpgsql set search_path = public as $$
begin
  if new.birth_date is not null and new.birth_date > current_date then raise exception 'Data de nascimento no futuro'; end if;
  return new;
end $$;
create trigger pets_validate before insert or update on public.pets for each row execute function public.validate_pet();

-- Appointments
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  service public.service_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.appointment_status not null default 'pendente',
  tutor_notes text check (char_length(tutor_notes) <= 1000),
  vet_notes text check (char_length(vet_notes) <= 1000),
  rescheduled_from timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index on public.appointments (starts_at);
grant select, insert, update on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create policy "appt read" on public.appointments for select to authenticated using (tutor_id = auth.uid() or public.has_role(auth.uid(),'vet'));
create policy "appt insert own" on public.appointments for insert to authenticated with check (
  tutor_id = auth.uid() and status = 'pendente'
  and exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid()));
create policy "appt update" on public.appointments for update to authenticated using (tutor_id = auth.uid() or public.has_role(auth.uid(),'vet'));

create or replace function public.guard_appointment_update() returns trigger language plpgsql set search_path = public as $$
begin
  if public.has_role(auth.uid(),'vet') then return new; end if;
  if new.status <> 'cancelado' or old.status not in ('pendente','confirmado')
     or new.starts_at <> old.starts_at or new.ends_at is distinct from old.ends_at
     or new.pet_id <> old.pet_id or new.service <> old.service or new.tutor_id <> old.tutor_id
     or new.vet_notes is distinct from old.vet_notes then
    raise exception 'Tutor só pode cancelar o agendamento';
  end if;
  return new;
end $$;
create trigger appt_guard before update on public.appointments for each row execute function public.guard_appointment_update();

-- Pet sitting details
create table public.pet_sitting_details (
  appointment_id uuid primary key references public.appointments(id) on delete cascade,
  feeding_routine text check (char_length(feeding_routine) <= 1000),
  medications text check (char_length(medications) <= 1000),
  house_instructions text check (char_length(house_instructions) <= 1000),
  emergency_contact text check (char_length(emergency_contact) <= 150)
);
grant select, insert, update on public.pet_sitting_details to authenticated;
grant all on public.pet_sitting_details to service_role;
alter table public.pet_sitting_details enable row level security;
create policy "psd read" on public.pet_sitting_details for select to authenticated using (
  public.has_role(auth.uid(),'vet') or exists (select 1 from public.appointments a where a.id = appointment_id and a.tutor_id = auth.uid()));
create policy "psd insert own" on public.pet_sitting_details for insert to authenticated with check (
  exists (select 1 from public.appointments a where a.id = appointment_id and a.tutor_id = auth.uid() and a.status = 'pendente'));
create policy "psd update" on public.pet_sitting_details for update to authenticated using (
  public.has_role(auth.uid(),'vet') or exists (select 1 from public.appointments a where a.id = appointment_id and a.tutor_id = auth.uid() and a.status = 'pendente'));

-- Future phase tables
create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  record_date date not null default current_date,
  anamnesis text, exam_findings text, diagnosis text, treatment text,
  created_at timestamptz not null default now()
);
create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  vaccine_name text not null check (char_length(vaccine_name) <= 100),
  applied_on date not null, next_dose_on date, batch text,
  created_at timestamptz not null default now()
);
create table public.visit_reports (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  visited_at timestamptz not null default now(),
  arrival_at timestamptz, departure_at timestamptz,
  checklist jsonb not null default '[]'::jsonb, notes text,
  created_at timestamptz not null default now()
);
create table public.visit_report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.visit_reports(id) on delete cascade,
  photo_path text not null, caption text,
  created_at timestamptz not null default now()
);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  kind text not null check (kind in ('receita','atestado','relatorio')),
  content jsonb not null default '{}'::jsonb, pdf_path text,
  issued_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  amount_cents integer not null check (amount_cents >= 0),
  method text check (method in ('pix','dinheiro','cartao','transferencia')),
  paid_at timestamptz, pix_code text, notes text,
  created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['medical_records','vaccinations','visit_reports','visit_report_photos','documents','payments'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "vet all" on public.%I for all to authenticated using (public.has_role(auth.uid(),''vet'')) with check (public.has_role(auth.uid(),''vet''))', t);
  end loop;
end $$;

create policy "tutor read" on public.medical_records for select to authenticated using (exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid()));
create policy "tutor read" on public.vaccinations for select to authenticated using (exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid()));
create policy "tutor read" on public.documents for select to authenticated using (exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid()));
create policy "tutor read" on public.visit_reports for select to authenticated using (exists (select 1 from public.appointments a where a.id = appointment_id and a.tutor_id = auth.uid()));
create policy "tutor read" on public.visit_report_photos for select to authenticated using (exists (select 1 from public.visit_reports r join public.appointments a on a.id = r.appointment_id where r.id = report_id and a.tutor_id = auth.uid()));
create policy "tutor read" on public.payments for select to authenticated using (tutor_id = auth.uid());
