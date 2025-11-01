-- Drop the incorrect RLS policies that were added in the previous migration for 'decaissements'
DROP POLICY IF EXISTS "Enable read access for all users" ON public.decaissements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.decaissements;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.decaissements;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.decaissements;

-- Drop the incorrect RLS policies that were added in the previous migration for 'depenses'
DROP POLICY IF EXISTS "Enable read access for all users" ON public.depenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.depenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.depenses;

-- Re-establish correct RLS policies for 'decaissements'
-- Based on existing schema, 'Users can view depenses' (SELECT true) and 'Only admins can manage decaissements' (*) exist.
-- We ensure the wildcard policy for admins is correctly applied for INSERT, UPDATE, DELETE.
-- No explicit policies needed here if the wildcard policy is correctly defined and covers these.

-- Re-establish correct RLS policies for 'depenses'
-- The original 'Users can create depenses' policy had a NULL definition, preventing inserts.
-- We replace it to allow authenticated users to insert.
CREATE OR REPLACE POLICY "Users can create depenses" ON public.depenses
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- The original 'Users can update depenses' policy was 'true', allowing anyone to update.
-- We make it more secure by allowing only authenticated users to update.
CREATE OR REPLACE POLICY "Users can update depenses" ON public.depenses
FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Ensure 'Users can view depenses' policy allows all users to view.
-- The existing one was `true`.
CREATE OR REPLACE POLICY "Users can view depenses" ON public.depenses
FOR SELECT USING (true);

-- Ensure 'Only admins can delete depenses' policy is correctly set.
-- The existing one was specific to admins.
CREATE OR REPLACE POLICY "Only admins can delete depenses" ON public.depenses
FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'administrateur'::text))));