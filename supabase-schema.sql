CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#06B6D4',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grid_blocks (
  id INT PRIMARY KEY,
  x INT NOT NULL,
  y INT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ,
  UNIQUE(x, y)
);

INSERT INTO public.grid_blocks (id, x, y)
SELECT
  row_number() OVER () - 1 AS id,
  x,
  y
FROM generate_series(0, 19) AS x
CROSS JOIN generate_series(0, 14) AS y
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'Player'),
    COALESCE(NEW.raw_user_meta_data ->> 'color', '#06B6D4')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.can_capture(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  last_capture TIMESTAMPTZ;
BEGIN
  SELECT MAX(captured_at) INTO last_capture
  FROM public.grid_blocks
  WHERE owner_id = user_id;

  IF last_capture IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN (now() - last_capture) > INTERVAL '1 second';
END;
$$;

CREATE OR REPLACE FUNCTION set_captured_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL AND (OLD.owner_id IS NULL OR OLD.owner_id != NEW.owner_id) THEN
    NEW.captured_at = now();
  ELSIF NEW.owner_id IS NULL THEN
    NEW.captured_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_captured_at ON public.grid_blocks;
CREATE TRIGGER trigger_set_captured_at
BEFORE UPDATE ON public.grid_blocks
FOR EACH ROW EXECUTE FUNCTION set_captured_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Grid blocks are viewable by authenticated users" ON public.grid_blocks;
CREATE POLICY "Grid blocks are viewable by authenticated users"
  ON public.grid_blocks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can capture unclaimed blocks with cooldown" ON public.grid_blocks;
DROP POLICY IF EXISTS "Users can re-stamp own blocks" ON public.grid_blocks;
DROP POLICY IF EXISTS "Users can claim or unclaim blocks" ON public.grid_blocks;

CREATE POLICY "Users can claim or unclaim blocks"
  ON public.grid_blocks FOR UPDATE
  TO authenticated
  USING (
    (owner_id IS NULL AND public.can_capture(auth.uid()))
    OR
    (owner_id = auth.uid())
  )
  WITH CHECK (
    owner_id = auth.uid() OR owner_id IS NULL
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.grid_blocks;
