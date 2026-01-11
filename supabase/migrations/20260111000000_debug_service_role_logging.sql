-- =====================================================
-- DEBUG: Log what the trigger sees for service role detection
-- Migration: 20260111000000_debug_service_role_logging.sql
-- 
-- This migration ONLY adds logging to understand what JWT claims
-- the trigger receives. It does NOT change any security behavior.
-- 
-- After running this, make a test donation and check Supabase logs
-- to see exactly what values are being passed.
-- 
-- REMEMBER TO REMOVE THIS AFTER DEBUGGING!
-- =====================================================

-- Create a logging function that shows all relevant settings
CREATE OR REPLACE FUNCTION public.log_jwt_context()
RETURNS void AS $$
DECLARE
    claim_role TEXT;
    claims_json TEXT;
    claim_sub TEXT;
    claim_iss TEXT;
    session_user_name TEXT;
    current_user_name TEXT;
BEGIN
    -- Capture all relevant settings
    claim_role := current_setting('request.jwt.claim.role', true);
    claims_json := current_setting('request.jwt.claims', true);
    claim_sub := current_setting('request.jwt.claim.sub', true);
    claim_iss := current_setting('request.jwt.claim.iss', true);
    session_user_name := session_user;
    current_user_name := current_user;
    
    -- Log everything
    RAISE LOG '🔍 JWT DEBUG - claim.role: %, claims: %, sub: %, iss: %, session_user: %, current_user: %',
        COALESCE(claim_role, 'NULL'),
        COALESCE(LEFT(claims_json, 200), 'NULL'),  -- Truncate to first 200 chars
        COALESCE(claim_sub, 'NULL'),
        COALESCE(claim_iss, 'NULL'),
        session_user_name,
        current_user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function to add logging BEFORE the security check
CREATE OR REPLACE FUNCTION public.prevent_sensitive_column_updates()
RETURNS TRIGGER AS $$
DECLARE
    claim_role TEXT;
    claims_json TEXT;
BEGIN
    -- Check if sensitive columns are being modified
    IF (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.payment_id IS DISTINCT FROM NEW.payment_id) OR
       (OLD.razorpay_signature IS DISTINCT FROM NEW.razorpay_signature) OR
       (OLD.amount_inr IS DISTINCT FROM NEW.amount_inr) OR
       (OLD.razorpay_fee_inr IS DISTINCT FROM NEW.razorpay_fee_inr) OR
       (OLD.net_amount_inr IS DISTINCT FROM NEW.net_amount_inr) THEN
        
        -- Get and log all JWT context
        claim_role := current_setting('request.jwt.claim.role', true);
        claims_json := current_setting('request.jwt.claims', true);
        
        -- Extensive logging
        RAISE LOG '🔐 SENSITIVE COLUMN UPDATE ATTEMPT:';
        RAISE LOG '   → request.jwt.claim.role = %', COALESCE(claim_role, 'NULL/EMPTY');
        RAISE LOG '   → request.jwt.claims (first 300 chars) = %', COALESCE(LEFT(claims_json, 300), 'NULL/EMPTY');
        RAISE LOG '   → session_user = %', session_user;
        RAISE LOG '   → current_user = %', current_user;
        RAISE LOG '   → Donation ID being updated: %', OLD.id;
        RAISE LOG '   → Status change: % → %', OLD.status, NEW.status;
        
        -- Original security check - unchanged
        IF COALESCE(claim_role, '') != 'service_role' THEN
            RAISE LOG '   ⛔ BLOCKED: role is not service_role';
            RAISE EXCEPTION 'Modifying payment-related columns is only allowed via service role. Attempted by role: %', 
                COALESCE(claim_role, 'unknown');
        ELSE
            RAISE LOG '   ✅ ALLOWED: role is service_role';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.log_jwt_context() IS 
    'DEBUG ONLY: Logs JWT context. Remove after debugging.';

COMMENT ON FUNCTION public.prevent_sensitive_column_updates() IS 
    'Protects sensitive donation columns. Currently has DEBUG logging enabled - remove after troubleshooting.';
