## Architecture rules
- User roles live only in `public.user_roles` and are checked via `has_role()` in RLS; UI role checks are cosmetic. Why: prevents privilege escalation.
- Home-access secrets (`home_access`) are written by tutors only through SECURITY DEFINER RPCs and readable only by the vet. Why: tutor must not re-read sensitive codes.
- Tutor appointment updates are restricted by the `guard_appointment_update` trigger (cancel only). Why: RLS can't express column-level transitions.
- Pet photos live in the private `pet-photos` bucket under `<user_id>/`, shown via 5-minute signed URLs. Why: no public files.
- Account deletion runs in a `requireSupabaseAuth` server function using the admin client; everything else cascades. Why: LGPD erasure.
