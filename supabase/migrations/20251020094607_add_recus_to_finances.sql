-- Add 'recus' column to 'decaissements' table
ALTER TABLE public.decaissements
ADD COLUMN recus text[] DEFAULT '{}'::text[];

-- Add 'recus' column to 'depenses' table
ALTER TABLE public.depenses
ADD COLUMN recus text[] DEFAULT '{}'::text[];