'use client';

/**
 * Public Donation Verifier Component
 * 
 * Allows anyone to verify that a donation is included in a Merkle batch
 * by entering either the donation ID or payment ID.
 * 
 * This provides cryptographic proof of transparency.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Search, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface VerificationResult {
  valid: boolean;
  merkleRoot: string;
  leafHash: string;
  error?: string;
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

export default function DonationVerifier() {
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a donation ID or payment ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/batches/verify-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationId: searchValue.startsWith('pay_') ? undefined : searchValue,
          paymentId: searchValue.startsWith('pay_') ? searchValue : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              placeholder="Enter Donation ID or Payment ID (pay_xxx)"
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
              {/* Status Banner */}
              <div
                className={`p-6 rounded-xl border-2 ${
                  result.valid
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {result.valid ? (
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-600" />
                  )}
                  <div>
                    <h3 className={`text-2xl font-bold ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                      {result.valid ? '✅ Verified!' : '❌ Verification Failed'}
                    </h3>
                    <p className={`text-sm ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                      {result.valid
                        ? 'This donation is cryptographically verified in our transparent batch system'
                        : result.error || 'Unable to verify this donation'}
                    </p>
                  </div>
                </div>
              </div>

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
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 font-bold ${result.donation.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                        {result.donation.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-bold text-gray-900">
                        {new Date(result.donation.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Batched:</span>
                      <span className={`ml-2 font-bold ${result.donation.batched ? 'text-green-700' : 'text-yellow-700'}`}>
                        {result.donation.batched ? 'Yes' : 'Not yet'}
                      </span>
                    </div>
                    {result.donation.batched && (
                      <>
                        <div>
                          <span className="text-gray-500">Batch Status:</span>
                          <span className={`ml-2 font-bold ${
                            result.donation.batch_status === 'confirmed' ? 'text-green-700' :
                            result.donation.batch_status === 'pending' ? 'text-yellow-700' :
                            result.donation.batch_status === 'anchoring' ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {result.donation.batch_status === 'confirmed' ? 'Confirmed on Blockchain' :
                             result.donation.batch_status === 'pending' ? 'Pending' :
                             result.donation.batch_status === 'anchoring' ? 'Anchoring...' : 
                             result.donation.batch_status || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">On Blockchain:</span>
                          <span className={`ml-2 font-bold ${result.donation.anchored ? 'text-green-700' : 'text-yellow-700'}`}>
                            {result.donation.anchored ? 'Yes ⛓️' : 'Pending'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Merkle Proof Details */}
              {result.valid && result.proof && (
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
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>What is this?</strong> Every donation is grouped into Merkle batches and anchored to Solana blockchain for permanent transparency. You can verify your donation is included using cryptographic proofs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

