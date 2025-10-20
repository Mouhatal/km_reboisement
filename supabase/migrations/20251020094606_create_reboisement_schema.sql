/*
  # Système de Suivi de Reboisement Communautaire

  Ce migration crée la structure complète de la base de données pour le système de suivi
  de projet de reboisement communautaire.

  ## 1. Tables Créées

  ### Authentification et Utilisateurs
    - `profiles` - Profils utilisateurs avec rôles (Administrateur/Enquêteur)
      - `id` (uuid, FK vers auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text: 'administrateur' ou 'enqueteur')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ### Module Îlots
    - `ilots` - Zones de reboisement
      - `id` (uuid, primary key)
      - `nom` (text)
      - `superficie_ha` (numeric)
      - `type_de_sol` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `nombre_de_plants` (integer)
      - `taux_de_survie` (numeric, pourcentage)
      - `photos` (text[], URLs des photos)
      - `date_de_suivi` (date)
      - `observations` (text)
      - `created_by` (uuid, FK vers profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ilots_historique` - Historique des suivis
      - `id` (uuid, primary key)
      - `ilot_id` (uuid, FK vers ilots)
      - `taux_de_survie` (numeric)
      - `nombre_de_plants` (integer)
      - `observations` (text)
      - `photos` (text[])
      - `date_de_suivi` (date)
      - `created_by` (uuid, FK vers profiles)
      - `created_at` (timestamptz)

  ### Module Activités
    - `activites` - Activités communautaires
      - `id` (uuid, primary key)
      - `type_activite` (text)
      - `date` (date)
      - `objectif` (text)
      - `public_cible` (text)
      - `montant_decaisse` (numeric)
      - `photos` (text[])
      - `factures` (text[])
      - `liste_presence` (text[])
      - `nombre_participants` (integer)
      - `commentaires` (text)
      - `created_by` (uuid, FK vers profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `activites_ilots` - Liaison activités-îlots
      - `activite_id` (uuid, FK vers activites)
      - `ilot_id` (uuid, FK vers ilots)

  ### Module Logistique
    - `materiel` - Matériel et équipements
      - `id` (uuid, primary key)
      - `type` (text)
      - `quantite` (integer)
      - `etat` (text: disponible/utilisé/en_panne/remplacé)
      - `emplacement` (text)
      - `date_acquisition` (date)
      - `ilot_affecte_id` (uuid, FK vers ilots, nullable)
      - `activite_affectee_id` (uuid, FK vers activites, nullable)
      - `alerte_maintenance` (boolean)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ### Module Finances
    - `decaissements` - Décaissements budgétaires
      - `id` (uuid, primary key)
      - `date` (date)
      - `montant` (numeric)
      - `reference_bancaire` (text)
      - `description` (text)
      - `created_by` (uuid, FK vers profiles)
      - `created_at` (timestamptz)

    - `depenses` - Dépenses par activité
      - `id` (uuid, primary key)
      - `activite_id` (uuid, FK vers activites)
      - `montant` (numeric)
      - `type_depense` (text)
      - `justificatif` (text, URL)
      - `remarque` (text)
      - `date` (date)
      - `created_by` (uuid, FK vers profiles)
      - `created_at` (timestamptz)

  ## 2. Sécurité (RLS)
    - RLS activé sur toutes les tables
    - Administrateurs : accès complet
    - Enquêteurs : lecture complète, création/modification limitée
    - Les utilisateurs ne peuvent voir que les données authentifiées

  ## 3. Index et Contraintes
    - Index sur les clés étrangères pour performance
    - Contraintes de vérification sur les montants (> 0)
    - Contraintes sur les pourcentages (0-100)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('administrateur', 'enqueteur')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Only admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'administrateur'
    )
  );

-- =====================================================
-- 2. ÎLOTS MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS ilots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  superficie_ha numeric NOT NULL CHECK (superficie_ha > 0),
  type_de_sol text NOT NULL,
  latitude numeric NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude numeric NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  nombre_de_plants integer NOT NULL DEFAULT 0 CHECK (nombre_de_plants >= 0),
  taux_de_survie numeric DEFAULT 0 CHECK (taux_de_survie >= 0 AND taux_de_survie <= 100),
  photos text[] DEFAULT '{}',
  date_de_suivi date NOT NULL DEFAULT CURRENT_DATE,
  observations text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ilots_created_by ON ilots(created_by);
CREATE INDEX IF NOT EXISTS idx_ilots_date_suivi ON ilots(date_de_suivi);

ALTER TABLE ilots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ilots"
  ON ilots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ilots"
  ON ilots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update ilots"
  ON ilots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete ilots"
  ON ilots FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'administrateur'
    )
  );

-- Historique des îlots
CREATE TABLE IF NOT EXISTS ilots_historique (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ilot_id uuid NOT NULL REFERENCES ilots(id) ON DELETE CASCADE,
  taux_de_survie numeric CHECK (taux_de_survie >= 0 AND taux_de_survie <= 100),
  nombre_de_plants integer CHECK (nombre_de_plants >= 0),
  observations text,
  photos text[] DEFAULT '{}',
  date_de_suivi date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historique_ilot ON ilots_historique(ilot_id);
CREATE INDEX IF NOT EXISTS idx_historique_date ON ilots_historique(date_de_suivi);

ALTER TABLE ilots_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view historique"
  ON ilots_historique FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create historique"
  ON ilots_historique FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- =====================================================
-- 3. ACTIVITÉS MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS activites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_activite text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  objectif text NOT NULL,
  public_cible text,
  montant_decaisse numeric DEFAULT 0 CHECK (montant_decaisse >= 0),
  photos text[] DEFAULT '{}',
  factures text[] DEFAULT '{}',
  liste_presence text[] DEFAULT '{}',
  nombre_participants integer DEFAULT 0 CHECK (nombre_participants >= 0),
  commentaires text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activites_date ON activites(date);
CREATE INDEX IF NOT EXISTS idx_activites_type ON activites(type_activite);
CREATE INDEX IF NOT EXISTS idx_activites_created_by ON activites(created_by);

ALTER TABLE activites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activites"
  ON activites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create activites"
  ON activites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update activites"
  ON activites FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete activites"
  ON activites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'administrateur'
    )
  );

-- Liaison activités-îlots
CREATE TABLE IF NOT EXISTS activites_ilots (
  activite_id uuid REFERENCES activites(id) ON DELETE CASCADE,
  ilot_id uuid REFERENCES ilots(id) ON DELETE CASCADE,
  PRIMARY KEY (activite_id, ilot_id)
);

CREATE INDEX IF NOT EXISTS idx_activites_ilots_activite ON activites_ilots(activite_id);
CREATE INDEX IF NOT EXISTS idx_activites_ilots_ilot ON activites_ilots(ilot_id);

ALTER TABLE activites_ilots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activites_ilots"
  ON activites_ilots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage activites_ilots"
  ON activites_ilots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. LOGISTIQUE MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS materiel (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  quantite integer NOT NULL DEFAULT 1 CHECK (quantite >= 0),
  etat text NOT NULL DEFAULT 'disponible' CHECK (etat IN ('disponible', 'utilise', 'en_panne', 'remplace')),
  emplacement text,
  date_acquisition date NOT NULL DEFAULT CURRENT_DATE,
  ilot_affecte_id uuid REFERENCES ilots(id) ON DELETE SET NULL,
  activite_affectee_id uuid REFERENCES activites(id) ON DELETE SET NULL,
  alerte_maintenance boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materiel_etat ON materiel(etat);
CREATE INDEX IF NOT EXISTS idx_materiel_ilot ON materiel(ilot_affecte_id);
CREATE INDEX IF NOT EXISTS idx_materiel_activite ON materiel(activite_affectee_id);

ALTER TABLE materiel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view materiel"
  ON materiel FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create materiel"
  ON materiel FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update materiel"
  ON materiel FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete materiel"
  ON materiel FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'administrateur'
    )
  );

-- =====================================================
-- 5. FINANCES MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS decaissements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  montant numeric NOT NULL CHECK (montant > 0),
  reference_bancaire text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decaissements_date ON decaissements(date);
CREATE INDEX IF NOT EXISTS idx_decaissements_created_by ON decaissements(created_by);

ALTER TABLE decaissements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view decaissements"
  ON decaissements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage decaissements"
  ON decaissements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'administrateur'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'administrateur'
    )
  );

-- Dépenses
CREATE TABLE IF NOT EXISTS depenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activite_id uuid REFERENCES activites(id) ON DELETE CASCADE,
  montant numeric NOT NULL CHECK (montant > 0),
  type_depense text NOT NULL,
  justificatif text,
  remarque text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_depenses_activite ON depenses(activite_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses(date);

ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view depenses"
  ON depenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create depenses"
  ON depenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update depenses"
  ON depenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete depenses"
  ON depenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'administrateur'
    )
  );

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ilots_updated_at BEFORE UPDATE ON ilots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activites_updated_at BEFORE UPDATE ON activites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materiel_updated_at BEFORE UPDATE ON materiel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create historique entry when ilot is updated
CREATE OR REPLACE FUNCTION create_ilot_historique()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.taux_de_survie != NEW.taux_de_survie OR 
      OLD.nombre_de_plants != NEW.nombre_de_plants OR
      OLD.date_de_suivi != NEW.date_de_suivi) THEN
    INSERT INTO ilots_historique (
      ilot_id, 
      taux_de_survie, 
      nombre_de_plants, 
      observations, 
      photos, 
      date_de_suivi,
      created_by
    ) VALUES (
      NEW.id,
      NEW.taux_de_survie,
      NEW.nombre_de_plants,
      NEW.observations,
      NEW.photos,
      NEW.date_de_suivi,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ilot_historique_trigger AFTER UPDATE ON ilots
  FOR EACH ROW EXECUTE FUNCTION create_ilot_historique();
