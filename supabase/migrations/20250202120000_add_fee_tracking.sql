-- Migration: Add fee tracking columns for Razorpay transparency
-- This allows us to show donors exactly how much goes to the charity after fees

-- Add columns for fee tracking
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS razorpay_fee_inr NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount_inr NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount_inr NUMERIC(10,2);

-- Add comment explaining the columns
COMMENT ON COLUMN donations.razorpay_fee_inr IS 'Razorpay platform fee charged (before GST)';
COMMENT ON COLUMN donations.tax_amount_inr IS 'GST charged on Razorpay fee';
COMMENT ON COLUMN donations.net_amount_inr IS 'Net amount received by charity after deducting fees and tax';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_donations_net_amount ON donations(net_amount_inr) WHERE status = 'completed';

-- Update existing completed donations to calculate net amount
-- (For existing donations where we don't have fee info, assume net = gross)
UPDATE donations
SET net_amount_inr = amount_inr
WHERE status = 'completed' AND net_amount_inr IS NULL;

