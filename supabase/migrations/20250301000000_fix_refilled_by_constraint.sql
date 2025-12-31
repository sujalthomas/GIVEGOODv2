-- =====================================================
-- FIX: NOT NULL constraint conflicts with ON DELETE SET NULL
-- for refilled_by column in feeder_refills table
-- =====================================================

-- The original constraint was:
--   refilled_by UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE SET NULL
-- 
-- This is invalid because ON DELETE SET NULL would try to set the column to NULL
-- when a volunteer is deleted, but NOT NULL prevents that.
--
-- Solution: Remove NOT NULL to allow NULL values when a volunteer is deleted.
-- This preserves the refill history even after volunteer deletion.

ALTER TABLE public.feeder_refills 
  ALTER COLUMN refilled_by DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN public.feeder_refills.refilled_by IS 
  'UUID of the volunteer who performed the refill. Can be NULL if volunteer record is deleted (preserves refill history).';
