-- Enable the uuid-ossp extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to create ilot historique on update
CREATE OR REPLACE FUNCTION public.create_ilot_historique()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF (OLD.taux_de_survie != NEW.taux_de_survie OR
      OLD.nombre_de_plants != NEW.nombre_de_plants OR
      OLD.date_de_suivi != NEW.date_de_suivi OR
      OLD.nombre_de_plants_survivants != NEW.nombre_de_plants_survivants) THEN -- Added this condition
    INSERT INTO ilots_historique (
      ilot_id,
      taux_de_survie,
      nombre_de_plants,
      nombre_de_plants_survivants, -- Added this column
      observations,
      photos,
      date_de_suivi,
      created_by
    ) VALUES (
      NEW.id,
      NEW.taux_de_survie,
      NEW.nombre_de_plants,
      NEW.nombre_de_plants_survivants, -- Added this value
      NEW.observations,
      NEW.photos,
      NEW.date_de_suivi,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'enqueteur', -- 'administrateur' or 'enqueteur'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to update 'updated_at' for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to insert profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Create ilots table
CREATE TABLE public.ilots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  superficie_ha NUMERIC NOT NULL,
  type_de_sol TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  nombre_de_plants INTEGER DEFAULT 0 NOT NULL,
  nombre_de_plants_survivants INTEGER DEFAULT 0 NOT NULL, -- Added this column
  taux_de_survie NUMERIC DEFAULT 0,
  photos TEXT[] DEFAULT '{}'::TEXT[],
  date_de_suivi DATE DEFAULT CURRENT_DATE NOT NULL,
  observations TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for ilots
ALTER TABLE public.ilots ENABLE ROW LEVEL SECURITY;

-- Trigger to update 'updated_at' for ilots
CREATE TRIGGER update_ilots_updated_at
BEFORE UPDATE ON public.ilots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create ilot historique on ilot update
CREATE TRIGGER ilot_historique_trigger
AFTER UPDATE ON public.ilots
FOR EACH ROW EXECUTE FUNCTION public.create_ilot_historique();


-- Create ilots_historique table
CREATE TABLE public.ilots_historique (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ilot_id UUID NOT NULL REFERENCES public.ilots(id) ON DELETE CASCADE,
  taux_de_survie NUMERIC,
  nombre_de_plants INTEGER,
  nombre_de_plants_survivants INTEGER, -- Added this column
  observations TEXT,
  photos TEXT[] DEFAULT '{}'::TEXT[],
  date_de_suivi DATE DEFAULT CURRENT_DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for ilots_historique
ALTER TABLE public.ilots_historique ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ilots_historique (Allow authenticated users to view)
CREATE POLICY "ilots_historique_select_policy" ON public.ilots_historique
FOR SELECT TO authenticated USING (true);

CREATE POLICY "ilots_historique_insert_policy" ON public.ilots_historique
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);


-- Create activites table
CREATE TABLE public.activites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type_activite TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  objectif TEXT NOT NULL,
  public_cible TEXT,
  montant_decaisse NUMERIC DEFAULT 0,
  photos TEXT[] DEFAULT '{}'::TEXT[],
  factures TEXT[] DEFAULT '{}'::TEXT[],
  liste_presence TEXT[] DEFAULT '{}'::TEXT[],
  nombre_participants INTEGER DEFAULT 0,
  commentaires TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for activites
ALTER TABLE public.activites ENABLE ROW LEVEL SECURITY;

-- Trigger to update 'updated_at' for activites
CREATE TRIGGER update_activites_updated_at
BEFORE UPDATE ON public.activites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Create activites_ilots join table
CREATE TABLE public.activites_ilots (
  activite_id UUID NOT NULL REFERENCES public.activites(id) ON DELETE CASCADE,
  ilot_id UUID NOT NULL REFERENCES public.ilots(id) ON DELETE CASCADE,
  PRIMARY KEY (activite_id, ilot_id)
);

-- Enable RLS for activites_ilots
ALTER TABLE public.activites_ilots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activites_ilots (Allow authenticated users to manage)
CREATE POLICY "activites_ilots_manage_policy" ON public.activites_ilots
FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Create materiel table
CREATE TABLE public.materiel (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  quantite INTEGER DEFAULT 1 NOT NULL,
  etat TEXT DEFAULT 'disponible' NOT NULL,
  emplacement TEXT,
  date_acquisition DATE DEFAULT CURRENT_DATE NOT NULL,
  ilot_affecte_id UUID REFERENCES public.ilots(id) ON DELETE SET NULL,
  activite_affectee_id UUID REFERENCES public.activites(id) ON DELETE SET NULL,
  alerte_maintenance BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Added this column
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for materiel
ALTER TABLE public.materiel ENABLE ROW LEVEL SECURITY;

-- Trigger to update 'updated_at' for materiel
CREATE TRIGGER update_materiel_updated_at
BEFORE UPDATE ON public.materiel
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for materiel (Allow authenticated users to view, create, update their own, admins can delete)
CREATE POLICY "materiel_select_policy" ON public.materiel
FOR SELECT TO authenticated USING (true);

CREATE POLICY "materiel_insert_policy" ON public.materiel
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "materiel_update_policy" ON public.materiel
FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "materiel_delete_admin_policy" ON public.materiel
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'));


-- Create decaissements table
CREATE TABLE public.decaissements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  montant NUMERIC NOT NULL,
  reference_bancaire TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Added this column
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recus TEXT[] DEFAULT '{}'::TEXT[] -- This column is added by a later migration, but including it here for completeness if that migration is removed.
);

-- Enable RLS for decaissements
ALTER TABLE public.decaissements ENABLE ROW LEVEL SECURITY;


-- Create depenses table
CREATE TABLE public.depenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  activite_id UUID REFERENCES public.activites(id) ON DELETE SET NULL,
  montant NUMERIC NOT NULL,
  type_depense TEXT NOT NULL,
  justificatif TEXT,
  remarque TEXT,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recus TEXT[] DEFAULT '{}'::TEXT[] -- This column is added by a later migration, but including it here for completeness if that migration is removed.
);

-- Enable RLS for depenses
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;


-- Create encaissements table
CREATE TABLE public.encaissements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  montant NUMERIC NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  justificatif TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for encaissements
ALTER TABLE public.encaissements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for encaissements (Only administrators can manage)
CREATE POLICY "encaissements_admin_manage_policy" ON public.encaissements
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'));