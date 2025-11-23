-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;

DROP POLICY IF EXISTS "activites_select_policy" ON public.activites;
DROP POLICY IF EXISTS "activites_insert_policy" ON public.activites;
DROP POLICY IF EXISTS "activites_update_policy" ON public.activites;
DROP POLICY IF EXISTS "activites_delete_policy" ON public.activites;
DROP POLICY IF EXISTS "Users can create activites" ON public.activites;
DROP POLICY IF EXISTS "Users can update activites" ON public.activites;
DROP POLICY IF EXISTS "Only admins can delete activites" ON public.activites;
DROP POLICY IF EXISTS "Users can view activites" ON public.activites;

DROP POLICY IF EXISTS "decaissements_admin_manage_policy" ON public.decaissements;
DROP POLICY IF EXISTS "Users can view decaissements" ON public.decaissements;
DROP POLICY IF EXISTS "Only admins can manage decaissements" ON public.decaissements;

DROP POLICY IF EXISTS "depenses_select_policy" ON public.depenses;
DROP POLICY IF EXISTS "depenses_insert_policy" ON public.depenses;
DROP POLICY IF EXISTS "depenses_update_policy" ON public.depenses;
DROP POLICY IF EXISTS "depenses_delete_policy" ON public.depenses;
DROP POLICY IF EXISTS "Users can view depenses" ON public.depenses;
DROP POLICY IF EXISTS "Users can create depenses" ON public.depenses;
DROP POLICY IF EXISTS "Users can update depenses" ON public.depenses;
DROP POLICY IF EXISTS "Only admins can delete depenses" ON public.depenses;


-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decaissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;


-- RLS Policies for public.profiles
-- Allow all authenticated users to view all profiles
CREATE POLICY "profiles_select_all_policy" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert their own profile (used by handle_new_user trigger)
CREATE POLICY "profiles_insert_own_policy" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "profiles_update_own_policy" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to delete their own profile, or admins to delete any
CREATE POLICY "profiles_delete_own_or_admin_policy" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'));


-- RLS Policies for public.activites
-- Allow all authenticated users to view all activities
CREATE POLICY "activites_select_all_policy" ON public.activites
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert their own activity
CREATE POLICY "activites_insert_own_policy" ON public.activites
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to update their own activity
CREATE POLICY "activites_update_own_policy" ON public.activites
FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Only administrators can delete activities
CREATE POLICY "activites_delete_admin_policy" ON public.activites
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'));


-- RLS Policies for public.decaissements
-- Only administrators can perform any operation (CRUD) on decaissements
CREATE POLICY "decaissements_admin_manage_policy" ON public.decaissements
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'));


-- RLS Policies for public.depenses
-- Allow authenticated users to view their own expenses, and admins to view all
CREATE POLICY "depenses_select_own_or_admin_policy" ON public.depenses
FOR SELECT TO authenticated USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'));

-- Allow authenticated users to insert their own expense
CREATE POLICY "depenses_insert_own_policy" ON public.depenses
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to update their own expense
CREATE POLICY "depenses_update_own_policy" ON public.depenses
FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Only administrators can delete expenses
CREATE POLICY "depenses_delete_admin_policy" ON public.depenses
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrateur'));