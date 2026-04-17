-- Capture extra onboarding fields and keep only supported branches.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'first_name') THEN
    ALTER TABLE public.users ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_name') THEN
    ALTER TABLE public.users ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'contact') THEN
    ALTER TABLE public.users ADD COLUMN contact TEXT;
  END IF;
END $$;

UPDATE public.users
SET
  first_name = COALESCE(first_name, split_part(COALESCE(full_name, ''), ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(trim(substr(COALESCE(full_name, ''), length(split_part(COALESCE(full_name, ''), ' ', 1)) + 1)), '')),
  full_name = trim(
    COALESCE(NULLIF(first_name, ''), '') || ' ' || COALESCE(NULLIF(last_name, ''), '')
  )
WHERE first_name IS NULL OR last_name IS NULL;

DO $$
DECLARE
  uganda_id UUID;
  sudan_id UUID;
  old_id UUID;
BEGIN
  SELECT id INTO uganda_id FROM public.branches WHERE name = 'Uganda Branch' LIMIT 1;
  IF uganda_id IS NULL THEN
    INSERT INTO public.branches (name) VALUES ('Uganda Branch') RETURNING id INTO uganda_id;
  END IF;

  FOR old_id IN SELECT id FROM public.branches WHERE name IN ('Branch A', 'Uganda') LOOP
    IF old_id <> uganda_id THEN
      UPDATE public.users SET branch_id = uganda_id WHERE branch_id = old_id;
      UPDATE public.transactions SET branch_origin = uganda_id WHERE branch_origin = old_id;
      UPDATE public.transactions SET branch_claimed = uganda_id WHERE branch_claimed = old_id;
      DELETE FROM public.branches WHERE id = old_id;
    END IF;
  END LOOP;

  SELECT id INTO sudan_id FROM public.branches WHERE name = 'Sudan Branch' LIMIT 1;
  IF sudan_id IS NULL THEN
    INSERT INTO public.branches (name) VALUES ('Sudan Branch') RETURNING id INTO sudan_id;
  END IF;

  FOR old_id IN SELECT id FROM public.branches WHERE name IN ('Branch B', 'South Sudan', 'Sudan') LOOP
    IF old_id <> sudan_id THEN
      UPDATE public.users SET branch_id = sudan_id WHERE branch_id = old_id;
      UPDATE public.transactions SET branch_origin = sudan_id WHERE branch_origin = old_id;
      UPDATE public.transactions SET branch_claimed = sudan_id WHERE branch_claimed = old_id;
      DELETE FROM public.branches WHERE id = old_id;
    END IF;
  END LOOP;

  DELETE FROM public.branches WHERE name IN ('Branch A', 'Branch B');
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  meta_first_name TEXT;
  meta_last_name TEXT;
  meta_full_name TEXT;
BEGIN
  meta_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
  meta_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
  meta_full_name := trim(
    COALESCE(NULLIF(meta_first_name, ''), '') || ' ' || COALESCE(NULLIF(meta_last_name, ''), '')
  );

  IF meta_full_name = '' THEN
    meta_full_name := new.raw_user_meta_data->>'full_name';
  END IF;

  INSERT INTO public.users (id, role, full_name, first_name, last_name, contact, email)
  VALUES (
    new.id,
    CASE
      WHEN new.email = 'kabcal04@gmail.com' THEN 'admin'::user_role
      ELSE 'pending'::user_role
    END,
    meta_full_name,
    NULLIF(meta_first_name, ''),
    NULLIF(meta_last_name, ''),
    NULLIF(new.raw_user_meta_data->>'contact', ''),
    new.email
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
