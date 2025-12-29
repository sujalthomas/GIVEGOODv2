-- =====================================================
-- FIX: Phone number constraint uses invalid regex
-- Migration: 20250202160000_fix_phone_constraint.sql
-- 
-- PostgreSQL doesn't support \d in POSIX regex.
-- Need to use [0-9] or [[:digit:]] instead.
-- =====================================================

-- Drop the old constraint that uses invalid \d
ALTER TABLE public.donations 
DROP CONSTRAINT IF EXISTS valid_phone;

-- Add corrected constraint using proper PostgreSQL regex
-- Accepts: NULL, +919876543210, 9876543210, or any E.164 format
ALTER TABLE public.donations 
ADD CONSTRAINT valid_phone CHECK (
    donor_phone IS NULL 
    OR donor_phone ~ '^(\+)?[1-9][0-9]{0,14}$'
);

-- Also fix the email constraint if it has similar issues
ALTER TABLE public.donations 
DROP CONSTRAINT IF EXISTS valid_email;

ALTER TABLE public.donations 
ADD CONSTRAINT valid_email CHECK (
    donor_email IS NULL 
    OR donor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Fix PAN constraint too
ALTER TABLE public.donations 
DROP CONSTRAINT IF EXISTS valid_pan;

ALTER TABLE public.donations 
ADD CONSTRAINT valid_pan CHECK (
    donor_pan IS NULL 
    OR donor_pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
);

COMMENT ON CONSTRAINT valid_phone ON public.donations IS 
    'Validates phone in E.164 format: optional + followed by 1-15 digits starting with 1-9';

