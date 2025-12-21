-- =====================================================
-- SECURITY FIX: Column-Level Security & Admin-Only Access
-- Migration: 20250202140000_fix_rls_column_security.sql
-- 
-- This migration fixes:
-- 1. Privacy: Restrict donation viewing to admins only
-- 2. Column security: Prevent status column updates by non-service users
-- 3. is_admin() bug: Remove incorrect JWT role checks
-- =====================================================

-- =====================================================
-- FIX 1: Correct the is_admin() function
-- The auth.jwt() ->> 'role' returns database roles (authenticated, anon, service_role)
-- NOT application roles. Remove those incorrect checks.
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Only check user_metadata and app_metadata for custom roles
    -- The top-level 'role' claim is the DATABASE role, not an app role
    RETURN (
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
        OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin IS 
    'Checks if current user has admin role in user_metadata or app_metadata. Used for authorization checks.';

-- =====================================================
-- FIX 2: Update donations_select_authenticated to require admin
-- Regular authenticated users should only see their own donations
-- =====================================================

DROP POLICY IF EXISTS "donations_select_authenticated" ON public.donations;

-- Admins can view all donations (for admin dashboard)
CREATE POLICY "donations_select_admin"
    ON public.donations
    FOR SELECT
    TO authenticated
    USING (
        -- Admins can see all donations
        is_admin()
        -- Regular users can only see their own donations
        OR created_by = auth.uid()
    );

-- =====================================================
-- FIX 3: Column-level security for donations table
-- RLS only controls row access, not column access.
-- We need to explicitly revoke UPDATE on sensitive columns.
-- =====================================================

-- First, revoke all UPDATE privileges (we'll re-grant specific columns)
REVOKE UPDATE ON public.donations FROM authenticated;

-- Grant UPDATE only on safe columns that users should be able to modify
-- These are fields that don't affect payment/financial status
-- Actual columns from donations table: donor_name, dedication_message, anonymous, notes, purpose
GRANT UPDATE (
    donor_name,
    dedication_message,
    anonymous,
    notes,
    purpose
) ON public.donations TO authenticated;

-- IMPORTANT: status, payment_id, razorpay_signature, amount_inr, etc.
-- are NOT granted to authenticated users. Only service_role can update these.

-- =====================================================
-- FIX 4: Add trigger as defense-in-depth for status protection
-- Even if grants are somehow bypassed, this trigger blocks status changes
-- =====================================================

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
        -- current_setting('request.jwt.claim.role', true) returns the database role
        IF COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN
            RAISE EXCEPTION 'Modifying payment-related columns is only allowed via service role. Attempted by role: %', 
                COALESCE(current_setting('request.jwt.claim.role', true), 'unknown');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS protect_donation_sensitive_columns ON public.donations;

-- Create the trigger
CREATE TRIGGER protect_donation_sensitive_columns
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_sensitive_column_updates();

COMMENT ON FUNCTION public.prevent_sensitive_column_updates IS 
    'Defense-in-depth trigger that prevents non-service users from modifying payment-related columns.';

COMMENT ON TRIGGER protect_donation_sensitive_columns ON public.donations IS 
    'Blocks updates to status, payment_id, amount, and other financial columns except by service_role.';

-- =====================================================
-- FIX 5: Update anchor_batches policy for admin-only access
-- =====================================================

DROP POLICY IF EXISTS "anchor_batches_select_authenticated" ON public.anchor_batches;

-- Admins can view all batches (for admin dashboard)
CREATE POLICY "anchor_batches_select_admin"
    ON public.anchor_batches
    FOR SELECT
    TO authenticated
    USING (
        is_admin()
    );

-- Non-admin authenticated users can view confirmed batches (for transparency/verification)
-- This ensures logged-in users can still verify donations on the transparency page
CREATE POLICY "anchor_batches_select_confirmed"
    ON public.anchor_batches
    FOR SELECT
    TO authenticated
    USING (
        status = 'confirmed'
    );

-- Note: The existing "anchor_batches_select_public" policy allows
-- anonymous users to see confirmed batches for the transparency page.
-- This is intentional for public verification.

-- =====================================================
-- VERIFICATION COMMENTS
-- =====================================================

-- To verify this migration worked, run:
-- SELECT is_admin(); -- Should return false for non-admin users
-- 
-- To make a user admin:
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb 
-- WHERE email = 'admin@example.com';
--
-- IMPORTANT: After updating user metadata, the user MUST log out and log back in
-- (or refresh their JWT token) for the change to take effect. The is_admin() 
-- function checks auth.jwt(), which reflects claims at login time, not the 
-- current database state. Alternatively, you can use Supabase's auth.refreshSession()
-- on the client side to get a new token with updated claims.
--
-- To test column security, try (should fail for non-service users):
-- UPDATE donations SET status = 'completed' WHERE id = 'some-id';


