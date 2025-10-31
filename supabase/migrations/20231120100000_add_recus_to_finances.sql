-- Add 'recus' column to 'decaissements' table
ALTER TABLE public.decaissements
ADD COLUMN recus text[] DEFAULT '{}'::text[];

-- Add 'recus' column to 'depenses' table
ALTER TABLE public.depenses
ADD COLUMN recus text[] DEFAULT '{}'::text[];

-- Optional: Add RLS policies if not already handled by a generic policy
-- For 'decaissements'
ALTER TABLE public.decaissements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.decaissements
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.decaissements
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.decaissements
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON public.decaissements
FOR DELETE USING (auth.uid() IS NOT NULL);

-- For 'depenses'
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.depenses
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.depenses
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.depenses
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON public.depenses
FOR DELETE USING (auth.uid() IS NOT NULL);