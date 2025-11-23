-- Safe patch for "recus" column on decaissements
ALTER TABLE public.decaissements
ADD COLUMN IF NOT EXISTS recus TEXT[] DEFAULT '{}'::TEXT[];

-- Safe patch for "recus" column on depenses (if needed)
ALTER TABLE public.depenses
ADD COLUMN IF NOT EXISTS recus TEXT[] DEFAULT '{}'::TEXT[];
