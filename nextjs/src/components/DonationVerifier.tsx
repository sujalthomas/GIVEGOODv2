'use client';

/**
 * Public Donation Verifier Component
 * 
 * Allows anyone to verify that a donation is included in a Merkle batch
 * by entering either the donation ID or payment ID.
 * 
 * This provides cryptographic proof of transparency.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Search, Shield, AlertCircle, Loader2, Clock, Info } from 'lucide-react';

interface VerificationResult {
  valid: boolean;
  merkleRoot: string;
  leafHash: string;
  error?: string;
  message?: string; // For pending batches
  donation?: {
    id: string;
    payment_id: string;
    amount_inr: number;
    created_at: string;
    status: string;
    batched: boolean;
    batch_id?: string;
    batch_status?: string;
    leaf_index?: number;
    anchored: boolean;
  };
  proof?: {
    steps: number;
    hashes: string[];
  };
}

interface DonationVerifierProps {
  initialValue?: string;
  autoVerify?: boolean;
}

export default function DonationVerifier({ initialValue = '', autoVerify = false }: DonationVerifierProps) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoVerified, setHasAutoVerified] = useState(false);

  // Update searchValue when initialValue prop changes
  useEffect(() => {
    if (initialValue) {
      setSearchValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  // Memoized verification handler to avoid stale closures
  const handleVerifyWithValue = useCallback(async (value: string) => {
    const searchTerm = value.trim();
    if (!searchTerm) {
      setError('Please enter a donation ID or payment ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Determine if this is a payment/order ID or a donation UUID
      const isPaymentOrOrderId = searchTerm.startsWith('pay_') || searchTerm.startsWith('order_');

      const response = await fetch('/api/batches/verify-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationId: isPaymentOrOrderId ? undefined : searchTerm,
          paymentId: isPaymentOrOrderId ? searchTerm : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          // Provide more helpful message for payment IDs
          if (searchTerm.startsWith('pay_')) {
            setError('Payment ID not found. This may be because the payment is still processing. Try using your Donation ID (UUID format) or Order ID (order_xxx) instead.');
          } else {
            setError(data.details || 'Donation not found. Please check the ID and try again.');
          }
        } else {
          setError(data.error || 'Verification failed');
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify donation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-verify when initialValue is available and autoVerify is true
  useEffect(() => {
    if (initialValue && autoVerify && !hasAutoVerified && !loading) {
      setHasAutoVerified(true);
      // Small delay to let the component render first
      const timer = setTimeout(() => {
        handleVerifyWithValue(initialValue);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialValue, autoVerify, hasAutoVerified, loading, handleVerifyWithValue]);

  // Wrapper for button/enter key that uses current searchValue
  const handleVerify = () => handleVerifyWithValue(searchValue);

  // Determine the state: verified, pending batch, or failed
  const isPendingBatch = result && !result.valid && result.donation && !result.donation.batched;
  const isVerified = result && result.valid;
  const isFailed = result && !result.valid && !isPendingBatch;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-2xl border-2 border-blue-200">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-12 h-12 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Verify Your Donation
              </h2>
            </div>
            <p className="text-gray-600">
              Enter your donation ID or Razorpay payment ID to verify it&apos;s included in our transparent blockchain batch
            </p>
          </div>

          {/* Search Input */}
          <div className="flex gap-3 mb-6">
            <Input
              type="text"
              placeholder="Enter Donation ID, Payment ID (pay_xxx), or Order ID (order_xxx)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              className="flex-1 text-lg"
            />
            <Button
              onClick={handleVerify}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Verify
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          )}

          {/* Verification Result */}
          {result && (
            <div className="space-y-6">
              {/* Status Banner - Different states */}

              {/* PENDING BATCH STATE */}
              {isPendingBatch && (
                <div className="p-6 rounded-xl border-2 bg-amber-50 border-amber-300">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Clock className="w-12 h-12 text-amber-600" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-amber-800">
                        ⏳ Pending Blockchain Batch
                      </h3>
                      <p className="text-sm text-amber-700">
                        Your donation was received successfully! It will be included in the next blockchain batch (usually within 24 hours).
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        <strong>What does this mean?</strong> We batch donations together before anchoring to the Solana blockchain to save costs.
                        Your donation is secure and will be cryptographically verified once the batch is processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* VERIFIED STATE */}
              {isVerified && (
                <div className="p-6 rounded-xl border-2 bg-green-50 border-green-300">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                    <div>
                      <h3 className="text-2xl font-bold text-green-800">
                        ✅ Verified on Blockchain!
                      </h3>
                      <p className="text-sm text-green-700">
                        This donation is cryptographically verified and permanently recorded on the Solana blockchain.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* FAILED STATE */}
              {isFailed && (
                <div className="p-6 rounded-xl border-2 bg-red-50 border-red-300">
                  <div className="flex items-center gap-4">
                    <XCircle className="w-12 h-12 text-red-600" />
                    <div>
                      <h3 className="text-2xl font-bold text-red-800">
                        ❌ Verification Failed
                      </h3>
                      <p className="text-sm text-red-700">
                        {result.error || 'Unable to verify this donation. Please contact support if you believe this is an error.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Donation Details */}
              {result.donation && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Donation Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="ml-2 font-bold text-green-700">₹{result.donation.amount_inr.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Status:</span>
                      <span className={`ml-2 font-bold ${result.donation.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                        {result.donation.status === 'completed' ? 'Payment Received ✓' : result.donation.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-bold text-gray-900">
                        {result.donation.created_at
                          ? new Date(result.donation.created_at).toLocaleString('en-IN')
                          : 'Just now'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Blockchain Status:</span>
                      <span className={`ml-2 font-bold ${result.donation.anchored ? 'text-green-700' :
                        result.donation.batched ? 'text-blue-700' : 'text-amber-600'
                        }`}>
                        {result.donation.anchored ? 'Confirmed ⛓️' :
                          result.donation.batched ? 'In Batch (Processing)' : 'Awaiting Batch'}
                      </span>
                    </div>
                    {result.donation.batched && (
                      <>
                        <div>
                          <span className="text-gray-500">Batch Status:</span>
                          <span className={`ml-2 font-bold ${result.donation.batch_status === 'confirmed' ? 'text-green-700' :
                            result.donation.batch_status === 'pending' ? 'text-yellow-700' :
                              result.donation.batch_status === 'anchoring' ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                            {result.donation.batch_status === 'confirmed' ? 'Confirmed on Blockchain' :
                              result.donation.batch_status === 'pending' ? 'Pending Anchor' :
                                result.donation.batch_status === 'anchoring' ? 'Anchoring to Solana...' :
                                  result.donation.batch_status || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Payment ID:</span>
                          <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {result.donation.payment_id.length > 20
                              ? result.donation.payment_id.substring(0, 20) + '...'
                              : result.donation.payment_id}
                          </code>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Merkle Proof Details - Only show for verified donations */}
              {isVerified && result.proof && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Cryptographic Proof
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Merkle Root (Batch Fingerprint):</span>
                      <code className="block mt-1 p-2 bg-white rounded text-xs font-mono text-blue-700 break-all border border-blue-200">
                        {result.merkleRoot}
                      </code>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Donation Hash (Leaf):</span>
                      <code className="block mt-1 p-2 bg-white rounded text-xs font-mono text-green-700 break-all border border-green-200">
                        {result.leafHash}
                      </code>
                    </div>
                    <div className="text-sm text-gray-600">
                      Proof Steps: <span className="font-bold text-gray-900">{result.proof.steps}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    💡 This Merkle proof mathematically guarantees your donation is included in the batch without revealing other donations.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Footer */}
          {!result && !error && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-sm text-blue-800">
                <strong>What is this?</strong> Every donation is grouped into Merkle batches and anchored to Solana blockchain for permanent transparency. You can verify your donation is included using cryptographic proofs.
              </p>
              <p className="text-xs text-blue-600">
                <strong>💡 Tip:</strong> Use your <strong>Donation ID</strong> (UUID) or <strong>Order ID</strong> (order_xxx) for best results. Payment IDs (pay_xxx) only work after payment processing is complete.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
