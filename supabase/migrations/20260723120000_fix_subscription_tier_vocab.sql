-- Fix profiles.subscription_tier to match the app's canonical vocabulary.
--
-- The base schema (20260720110000) predates the Paint the Town pivot and left the
-- column with the old W4nder tier names:
--     default 'free', check in ('free','standard','premium','family')
--
-- Every consumer written after the pivot — the RevenueCat webhook
-- (supabase/functions/revenuecat-webhook), the quota logic
-- (supabase/functions/generate-date-plan/quota.ts), lib/purchases.ts and
-- services/datePlanService.ts — uses ('trial','basic','premium').
--
-- The mismatch is launch-blocking: the webhook is the ONLY writer of this column,
-- and its UPDATEs to 'basic' or 'trial' hit the old CHECK constraint, fail, and
-- return 500. RevenueCat then retries forever, so the Basic tier never activates
-- and expirations never downgrade. Only 'premium' happened to be valid in both
-- vocabularies, which is why it worked and Basic did not.
--
-- Read paths already tolerate the old values (unknown -> 'trial'), so migrating the
-- stored data and the constraint is safe and self-contained.

alter table public.profiles
  drop constraint if exists profiles_subscription_tier_check;

-- Migrate any legacy values to the canonical vocabulary. 'premium' is unchanged.
update public.profiles set subscription_tier = 'trial' where subscription_tier = 'free';
update public.profiles set subscription_tier = 'basic' where subscription_tier = 'standard';
update public.profiles set subscription_tier = 'premium' where subscription_tier = 'family';

alter table public.profiles
  alter column subscription_tier set default 'trial';

alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('trial', 'basic', 'premium'));
