-- =====================================================
-- Fix RLS for feeder_refills DELETE operations
-- =====================================================
-- Issue: DELETE operations were failing silently due to missing RLS policy
-- Solution: Add DELETE policy for authenticated users + update GRANT

-- Add DELETE policy for authenticated users
-- (API routes already check for admin, so we allow authenticated users here)
CREATE POLICY "Authenticated users can delete refills"
  ON public.feeder_refills
  FOR DELETE
  TO authenticated
  USING (true);

-- Update GRANT to include DELETE permission
-- (Previously only had SELECT, INSERT, UPDATE)
GRANT DELETE ON public.feeder_refills TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

