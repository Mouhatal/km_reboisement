-- Fix RLS policy for 'activites' to allow authenticated users to insert
DROP POLICY IF EXISTS "Users can create activites" ON public.activites;
CREATE POLICY "Users can create activites" ON public.activites
FOR INSERT TO authenticated WITH CHECK (true);

-- Fix RLS policy for 'depenses' to allow authenticated users to insert
DROP POLICY IF EXISTS "Users can create depenses" ON public.depenses;
CREATE POLICY "Users can create depenses" ON public.depenses
FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure SELECT policy for 'decaissements' allows authenticated users to view
-- This policy already exists with 'true' definition, but we ensure it's explicitly set.
DROP POLICY IF EXISTS "Users can view decaissements" ON public.decaissements;
CREATE POLICY "Users can view decaissements" ON public.decaissements
FOR SELECT TO authenticated USING (true);