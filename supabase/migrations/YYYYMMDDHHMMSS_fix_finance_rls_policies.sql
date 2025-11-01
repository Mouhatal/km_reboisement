-- Drop the problematic INSERT policy for depenses if it exists
DROP POLICY IF EXISTS "Users can create depenses" ON public.depenses;

-- Recreate the INSERT policy for depenses to allow authenticated users to insert
CREATE POLICY "Users can create depenses" ON public.depenses
FOR INSERT TO authenticated WITH CHECK (true);

-- Add a SELECT policy for decaissements to allow authenticated users to view
-- This ensures non-admin authenticated users can see decaissements.
DROP POLICY IF EXISTS "Users can view decaissements" ON public.decaissements;
CREATE POLICY "Users can view decaissements" ON public.decaissements
FOR SELECT TO authenticated USING (true);