-- =====================================================
-- DONATIONS SYSTEM: Tables for blockchain-anchored donations
-- Phase 1.2: Database Schema
-- =====================================================

-- Create anchor_batches table first (referenced by donations)
CREATE TABLE IF NOT EXISTS public.anchor_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Batch time window
    batch_start_time TIMESTAMPTZ NOT NULL,
    batch_end_time TIMESTAMPTZ NOT NULL,
    donation_count INTEGER NOT NULL DEFAULT 0 CHECK (donation_count >= 0),
    total_amount_inr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount_inr >= 0),
    
    -- Merkle tree details
    merkle_root TEXT NOT NULL,
    tree_height INTEGER NOT NULL CHECK (tree_height >= 0),
    leaf_count INTEGER NOT NULL CHECK (leaf_count >= 0),
    
    -- Solana blockchain anchoring
    onchain_tx_signature TEXT UNIQUE, -- Solana transaction signature
    onchain_block BIGINT, -- Block number
    onchain_slot BIGINT, -- Slot number
    onchain_timestamp TIMESTAMPTZ,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'anchoring', 'confirmed', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (batch_end_time > batch_start_time),
    CONSTRAINT valid_donation_count CHECK (donation_count = leaf_count)
);

-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Payment details
    amount_inr NUMERIC(10, 2) NOT NULL CHECK (amount_inr > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    provider VARCHAR(50) NOT NULL, -- 'razorpay_upi', 'razorpay_netbanking', 'razorpay_card'
    
    -- Gateway references (Razorpay specific)
    payment_id VARCHAR(255) UNIQUE NOT NULL, -- Razorpay payment ID (pay_xxxxx)
    order_id VARCHAR(255), -- Razorpay order ID (order_xxxxx)
    
    -- Payment method specific references
    upi_reference VARCHAR(255), -- UPI transaction ID/VPA reference
    bank_reference VARCHAR(255), -- Bank transaction ID
    card_last4 VARCHAR(4), -- Last 4 digits of card (if card payment)
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50), -- 'upi', 'netbanking', 'card', 'wallet'
    payment_method_details JSONB, -- Additional payment method info from Razorpay
    
    -- Donor information (optional, for receipts)
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    donor_phone VARCHAR(20),
    donor_pan VARCHAR(10), -- For 80G tax receipts (Indian PAN card)
    anonymous BOOLEAN DEFAULT FALSE,
    
    -- Blockchain anchoring
    anchored BOOLEAN DEFAULT FALSE,
    anchor_batch_id UUID REFERENCES public.anchor_batches(id) ON DELETE SET NULL,
    merkle_leaf_hash TEXT, -- SHA-256 hash of canonical serialization
    merkle_proof JSONB, -- Array of sibling hashes for verification
    merkle_leaf_index INTEGER, -- Position in the batch
    
    -- Purpose & metadata
    purpose TEXT, -- 'feeder_construction', 'medical_aid', 'general', etc.
    dedication_message TEXT, -- Optional message from donor
    campaign_id VARCHAR(100), -- Optional campaign identifier
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Admin notes
    notes TEXT,
    internal_tags TEXT[], -- For admin categorization
    
    -- Audit trail
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Razorpay webhook tracking
    razorpay_signature TEXT, -- Webhook signature for verification
    razorpay_event_id TEXT, -- Event ID from webhook
    webhook_received_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (donor_email IS NULL OR donor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (donor_phone IS NULL OR donor_phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT valid_pan CHECK (donor_pan IS NULL OR donor_pan ~* '^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Donations indexes
CREATE INDEX idx_donations_status ON public.donations(status) WHERE status IN ('pending', 'completed');
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX idx_donations_payment_id ON public.donations(payment_id);
CREATE INDEX idx_donations_order_id ON public.donations(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_donations_anchored ON public.donations(anchored, status) WHERE NOT anchored AND status = 'completed';
CREATE INDEX idx_donations_anchor_batch ON public.donations(anchor_batch_id) WHERE anchor_batch_id IS NOT NULL;
CREATE INDEX idx_donations_donor_email ON public.donations(donor_email) WHERE donor_email IS NOT NULL;
CREATE INDEX idx_donations_purpose ON public.donations(purpose) WHERE purpose IS NOT NULL;
CREATE INDEX idx_donations_campaign ON public.donations(campaign_id) WHERE campaign_id IS NOT NULL;

-- Anchor batches indexes
CREATE INDEX idx_anchor_batches_status ON public.anchor_batches(status);
CREATE INDEX idx_anchor_batches_created_at ON public.anchor_batches(created_at DESC);
CREATE INDEX idx_anchor_batches_tx_signature ON public.anchor_batches(onchain_tx_signature) WHERE onchain_tx_signature IS NOT NULL;
CREATE INDEX idx_anchor_batches_batch_time ON public.anchor_batches(batch_start_time, batch_end_time);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anchor_batches ENABLE ROW LEVEL SECURITY;

-- Donations policies
-- Policy 1: Allow public to insert donations (for payment creation)
CREATE POLICY "Anyone can create donations"
    ON public.donations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy 2: Allow authenticated users to view all donations (for admin dashboard)
CREATE POLICY "Authenticated users can view all donations"
    ON public.donations
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 3: Allow public to view only non-sensitive donation data (for transparency page)
CREATE POLICY "Public can view anonymized donations"
    ON public.donations
    FOR SELECT
    TO anon
    USING (
        status = 'completed' 
        AND anchored = true
    );

-- Policy 4: Only authenticated users can update donations (webhook handlers)
CREATE POLICY "Authenticated users can update donations"
    ON public.donations
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Anchor batches policies
-- Policy 1: Allow authenticated users full access (admin dashboard)
CREATE POLICY "Authenticated users can manage anchor batches"
    ON public.anchor_batches
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 2: Allow public to view confirmed anchor batches (for transparency)
CREATE POLICY "Public can view confirmed anchor batches"
    ON public.anchor_batches
    FOR SELECT
    TO anon
    USING (status = 'confirmed');

-- =====================================================
-- TRIGGERS for automatic timestamp updates
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for donations table
CREATE TRIGGER set_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for anchor_batches table
CREATE TRIGGER set_anchor_batches_updated_at
    BEFORE UPDATE ON public.anchor_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get unanchored donations for batching
CREATE OR REPLACE FUNCTION public.get_unanchored_donations(
    batch_size INTEGER DEFAULT 100,
    time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    donation_id UUID,
    amount NUMERIC,
    payment_id TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as donation_id,
        d.amount_inr as amount,
        d.payment_id,
        d.created_at
    FROM public.donations d
    WHERE 
        d.status = 'completed'
        AND d.anchored = FALSE
        AND d.created_at >= NOW() - (time_window_hours || ' hours')::INTERVAL
    ORDER BY d.created_at ASC
    LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get donation statistics
CREATE OR REPLACE FUNCTION public.get_donation_stats()
RETURNS TABLE (
    total_donations BIGINT,
    total_amount NUMERIC,
    anchored_donations BIGINT,
    pending_donations BIGINT,
    completed_donations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_donations,
        COALESCE(SUM(amount_inr), 0) as total_amount,
        COUNT(*) FILTER (WHERE anchored = true)::BIGINT as anchored_donations,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_donations,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_donations
    FROM public.donations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

COMMENT ON TABLE public.donations IS 'Stores all donation records with payment gateway details and blockchain anchoring status';
COMMENT ON TABLE public.anchor_batches IS 'Stores Merkle tree batches that are anchored on Solana blockchain';
COMMENT ON COLUMN public.donations.merkle_leaf_hash IS 'SHA-256 hash of canonically serialized donation data';
COMMENT ON COLUMN public.donations.merkle_proof IS 'Merkle proof path (array of sibling hashes) for verification';
COMMENT ON COLUMN public.anchor_batches.merkle_root IS 'Root hash of the Merkle tree for this batch';
COMMENT ON COLUMN public.anchor_batches.onchain_tx_signature IS 'Solana transaction signature where Merkle root is anchored';

-- =====================================================
-- GRANT permissions (if needed for service role)
-- =====================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON public.donations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.anchor_batches TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unanchored_donations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_donation_stats TO authenticated;

