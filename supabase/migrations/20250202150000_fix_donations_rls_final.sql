-- =====================================================
-- FINAL RLS FIX: Complete overhaul of donations policies
-- Migration: 20250202150000_fix_donations_rls_final.sql
-- 
-- This migration completely resets and fixes all RLS policies
-- for the donations table to work correctly with:
-- 1. Service role (webhooks, API routes) - full access (bypasses RLS)
-- 2. Authenticated users - view their own donations
-- 3. Anonymous users - view completed donations (transparency page)
-- 
-- KEY INSIGHT: The issue was that multiple migrations added 
-- conflicting policies. Service role bypasses RLS anyway, 
-- but anon/authenticated need proper policies.
-- =====================================================

-- First, drop ALL existing donation policies to start fresh
DROP POLICY IF EXISTS "donations_insert_policy" ON public.donations;
DROP POLICY IF EXISTS "donations_update_policy" ON public.donations;
DROP POLICY IF EXISTS "donations_select_authenticated" ON public.donations;
DROP POLICY IF EXISTS "donations_select_public" ON public.donations;
DROP POLICY IF EXISTS "donations_insert_anon" ON public.donations;
DROP POLICY IF EXISTS "donations_update_service_only" ON public.donations;
DROP POLICY IF EXISTS "donations_select_admin" ON public.donations;
DROP POLICY IF EXISTS "Anyone can create donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Public can view anonymized donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can update donations" ON public.donations;

-- =====================================================
-- GRANTS: Set up proper column-level permissions
-- =====================================================

-- Revoke ALL permissions first (reset)
REVOKE ALL ON public.donations FROM anon;
REVOKE ALL ON public.donations FROM authenticated;

-- Grant SELECT to both roles (RLS will control row access)
GRANT SELECT ON public.donations TO anon;
GRANT SELECT ON public.donations TO authenticated;

-- Grant INSERT to both roles (RLS will control what can be inserted)
-- NOTE: In production, we use service role for inserts, but this is a fallback
GRANT INSERT ON public.donations TO anon;
GRANT INSERT ON public.donations TO authenticated;

-- Grant UPDATE only on non-sensitive columns to authenticated users
-- (Service role bypasses this for webhooks)
GRANT UPDATE (
    donor_name,
    dedication_message,
    anonymous,
    notes,
    purpose
) ON public.donations TO authenticated;

-- =====================================================
-- RLS POLICIES: Define access rules
-- =====================================================

-- POLICY 1: Allow SELECT for anonymous users on completed donations (transparency page)
CREATE POLICY "anon_select_completed"
    ON public.donations
    FOR SELECT
    TO anon
    USING (
        status = 'completed'
    );

-- POLICY 2: Allow SELECT for authenticated users
-- - Admins can see all donations
-- - Regular users can see only their own donations
CREATE POLICY "authenticated_select_own_or_admin"
    ON public.donations
    FOR SELECT
    TO authenticated
    USING (
        -- Check if user is admin
        (
            COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
            OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin')
        )
        -- Or user created the donation
        OR created_by = auth.uid()
        -- Or donation is completed (for transparency features)
        OR status = 'completed'
    );

-- POLICY 3: Allow INSERT for anon/authenticated
-- NOTE: In practice, we use service role for inserts via API route
-- This is a fallback policy that allows pending donations only
CREATE POLICY "allow_insert_pending"
    ON public.donations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        -- Only allow creating with pending status
        status = 'pending'
        -- Amount must be positive
        AND amount_inr > 0
    );

-- POLICY 4: Allow UPDATE for authenticated users (limited columns via GRANT)
-- Users can only update their own donations
CREATE POLICY "authenticated_update_own"
    ON public.donations
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
    )
    WITH CHECK (
        created_by = auth.uid()
    );

-- =====================================================
-- Ensure trigger for sensitive column protection exists
-- =====================================================

-- Create or replace the trigger function for defense-in-depth
CREATE OR REPLACE FUNCTION public.prevent_sensitive_column_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if sensitive columns are being modified
    IF (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.payment_id IS DISTINCT FROM NEW.payment_id) OR
       (OLD.razorpay_signature IS DISTINCT FROM NEW.razorpay_signature) OR
       (OLD.amount_inr IS DISTINCT FROM NEW.amount_inr) OR
       (OLD.razorpay_fee_inr IS DISTINCT FROM NEW.razorpay_fee_inr) OR
       (OLD.net_amount_inr IS DISTINCT FROM NEW.net_amount_inr) THEN
        
        -- Only allow service_role to modify these columns
        IF COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN
            RAISE EXCEPTION 'Modifying payment-related columns is only allowed via service role. Attempted by role: %', 
                COALESCE(current_setting('request.jwt.claim.role', true), 'unknown');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS protect_donation_sensitive_columns ON public.donations;

CREATE TRIGGER protect_donation_sensitive_columns
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_sensitive_column_updates();

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

COMMENT ON POLICY "anon_select_completed" ON public.donations IS 
    'Anonymous users can view completed donations for transparency page.';

COMMENT ON POLICY "authenticated_select_own_or_admin" ON public.donations IS 
    'Authenticated users can view their own donations, admins can view all, and everyone can view completed donations.';

COMMENT ON POLICY "allow_insert_pending" ON public.donations IS 
    'Allows donation creation with pending status. In practice, service role is used for API inserts.';

COMMENT ON POLICY "authenticated_update_own" ON public.donations IS 
    'Users can only update non-sensitive fields of their own donations. Service role handles payment updates via webhooks.';

-- =====================================================
-- VERIFICATION QUERIES (run manually to test)
-- =====================================================

-- Test 1: As anon, should only see completed donations
-- SELECT * FROM donations WHERE status != 'completed'; -- Should return 0 rows

-- Test 2: Insert should work for pending status
-- INSERT INTO donations (amount_inr, currency, provider, payment_id, status) 
-- VALUES (100, 'INR', 'razorpay', 'test_123', 'pending');

-- Test 3: Insert should fail for completed status (anon)
-- INSERT INTO donations (amount_inr, currency, provider, payment_id, status) 
-- VALUES (100, 'INR', 'razorpay', 'test_456', 'completed'); -- Should fail

