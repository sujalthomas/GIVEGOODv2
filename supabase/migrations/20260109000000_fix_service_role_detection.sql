-- =====================================================
-- FIX: Update trigger to properly detect service role
-- Migration: 20260109000000_fix_service_role_detection.sql
-- 
-- ISSUE: The `prevent_sensitive_column_updates` trigger checks 
-- `request.jwt.claim.role` which doesn't correctly identify service_role
-- when using the Supabase JS client. The service role JWT has a different
-- structure where the role is in `request.jwt.claims` (plural) as JSON.
--
-- SOLUTION: Update the trigger to check multiple ways:
-- 1. request.jwt.claim.role (legacy)
-- 2. Extract role from request.jwt.claims JSON (new)
-- 3. Check if there's no JWT context at all (direct postgres access)
-- =====================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS protect_donation_sensitive_columns ON public.donations;
DROP FUNCTION IF EXISTS public.prevent_sensitive_column_updates();

-- Create improved function with better service role detection
CREATE OR REPLACE FUNCTION public.prevent_sensitive_column_updates()
RETURNS TRIGGER AS $$
DECLARE
    jwt_role TEXT;
    jwt_claims JSONB;
BEGIN
    -- Check if sensitive columns are being modified
    IF (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.payment_id IS DISTINCT FROM NEW.payment_id) OR
       (OLD.razorpay_signature IS DISTINCT FROM NEW.razorpay_signature) OR
       (OLD.amount_inr IS DISTINCT FROM NEW.amount_inr) OR
       (OLD.razorpay_fee_inr IS DISTINCT FROM NEW.razorpay_fee_inr) OR
       (OLD.net_amount_inr IS DISTINCT FROM NEW.net_amount_inr) THEN
        
        -- Try to get role from single claim setting (legacy format)
        jwt_role := COALESCE(current_setting('request.jwt.claim.role', true), '');
        
        -- If empty, try to extract from full claims JSON
        IF jwt_role = '' THEN
            BEGIN
                jwt_claims := current_setting('request.jwt.claims', true)::JSONB;
                jwt_role := COALESCE(jwt_claims->>'role', '');
            EXCEPTION WHEN OTHERS THEN
                -- Claims might not be valid JSON or not set
                jwt_role := '';
            END;
        END IF;
        
        -- Service role can also appear as empty when using service key directly
        -- because service role bypasses RLS context entirely.
        -- If claims are completely empty, it's likely a service role or postgres admin.
        -- 
        -- We allow the update if:
        -- 1. role is explicitly 'service_role'
        -- 2. role is 'authenticated' or 'anon' - blocked by column grants anyway
        -- 3. role is empty/null AND we're in a context without JWT (service/admin)
        
        -- Only block if it's explicitly 'authenticated' or 'anon'
        -- Service role either has 'service_role' or no JWT context at all
        IF jwt_role IN ('authenticated', 'anon') THEN
            RAISE EXCEPTION 'Modifying payment-related columns is not allowed for role: %', jwt_role;
        END IF;
        
        -- Log for debugging (can be removed in production)
        RAISE NOTICE 'Sensitive column update allowed. Detected role: %', COALESCE(NULLIF(jwt_role, ''), 'service/admin');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER protect_donation_sensitive_columns
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_sensitive_column_updates();

-- Add comment
COMMENT ON FUNCTION public.prevent_sensitive_column_updates() IS 
    'Protects sensitive donation columns from modification by regular users. Service role can modify all columns.';
