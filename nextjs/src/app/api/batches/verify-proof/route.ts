/**
 * Verify Merkle Proof API Route
 * 
 * This endpoint allows anyone to verify that a donation is included
 * in a batch using its Merkle proof.
 * 
 * This provides PUBLIC transparency - anyone can verify donations.
 * 
 * Usage: POST /api/batches/verify-proof
 * Body: { donationId: "uuid" } or { paymentId: "pay_xxx" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSSRClient } from '@/lib/supabase/server';
import { verifyMerkleProof, computeLeafHash } from '@/lib/merkle/builder';
import { applyRateLimit } from '@/lib/security/rateLimit';
import type { DonationLeaf, MerkleProof, VerificationResult } from '@/lib/merkle/types';
import type { Tables } from '@/lib/types';

type Donation = Tables<'donations'>;
type AnchorBatch = Tables<'anchor_batches'>;

/**
 * Core verification logic - shared between GET and POST
 * This function does NOT apply rate limiting (caller's responsibility)
 */
async function performVerification(donationId: string | null, paymentId: string | null): Promise<NextResponse> {
  console.log(`🔎 Verifying donation: ${donationId || paymentId}`);
  
  // Initialize Supabase client
  const supabase = await createSSRClient();
  
  // STEP 1: Fetch donation with batch info
  let query = supabase
    .from('donations')
    .select('*, anchor_batches(merkle_root, status)');
  
  if (donationId) {
    query = query.eq('id', donationId);
  } else if (paymentId) {
    query = query.eq('payment_id', paymentId);
  }
  
  const { data: donation, error: fetchError } = await query.single() as unknown as {
    data: Donation & { anchor_batches: AnchorBatch | AnchorBatch[] };
    error: unknown;
  };
  
  if (fetchError || !donation) {
    console.error('❌ Donation not found:', fetchError);
    
    const searchType = donationId ? 'Donation ID' : 'Payment ID';
    const searchValue = donationId || paymentId;
    
    return NextResponse.json(
      { 
        error: 'Donation not found',
        details: `No donation found with ${searchType}: ${searchValue}. Please check the ID and try again.`,
        searchType,
        searchValue
      },
      { status: 404 }
    );
  }
  
  // STEP 2: Check if donation has been batched
  if (!donation.anchor_batch_id || !donation.merkle_proof || !donation.merkle_leaf_hash) {
    console.log('ℹ️ Donation not yet batched');
    return NextResponse.json({
      valid: false,
      message: 'Donation has not been batched yet',
      donation: {
        id: donation.id,
        payment_id: donation.payment_id,
        amount_inr: donation.amount_inr,
        status: donation.status,
        batched: false,
      },
    });
  }
  
  console.log(`✅ Donation is in batch: ${donation.anchor_batch_id}`);
  
  // STEP 3: Get batch Merkle root
  const batchInfo = Array.isArray(donation.anchor_batches) 
    ? donation.anchor_batches[0] 
    : donation.anchor_batches;
  
  if (!batchInfo || !batchInfo.merkle_root) {
    console.error('❌ Batch not found or missing merkle_root');
    return NextResponse.json(
      { error: 'Batch information incomplete' },
      { status: 500 }
    );
  }
  
  const merkleRoot = batchInfo.merkle_root;
  
  // STEP 4: Reconstruct leaf from donation data
  const leaf: DonationLeaf = {
    id: donation.id,
    amount_inr: donation.amount_inr,
    currency: donation.currency,
    payment_id: donation.payment_id,
    upi_reference: donation.upi_reference,
    created_at: donation.created_at,
    payment_method: donation.payment_method,
    donor_name: donation.donor_name,
    anonymous: donation.anonymous,
  };
  
  const computedLeafHash = computeLeafHash(leaf);
  
  // STEP 5: Verify stored leaf hash matches computed hash
  if (computedLeafHash !== donation.merkle_leaf_hash) {
    console.error('❌ Leaf hash mismatch!');
    console.error(`   Stored: ${donation.merkle_leaf_hash}`);
    console.error(`   Computed: ${computedLeafHash}`);
    
    return NextResponse.json({
      valid: false,
      merkleRoot: '',
      leafHash: computedLeafHash,
      error: 'Leaf hash mismatch - donation data may have been tampered with',
      storedHash: donation.merkle_leaf_hash,
      computedHash: computedLeafHash,
    });
  }
  
  console.log('✅ Leaf hash matches stored hash');
  
  // STEP 6: Verify Merkle proof
  const proof = donation.merkle_proof as unknown as MerkleProof[];
  const isValid = verifyMerkleProof(computedLeafHash, proof, merkleRoot);
  
  const result: VerificationResult = {
    valid: isValid,
    merkleRoot,
    leafHash: computedLeafHash,
  };
  
  if (!isValid) {
    result.error = 'Merkle proof verification failed';
  }
  
  console.log(`${isValid ? '✅' : '❌'} Verification ${isValid ? 'PASSED' : 'FAILED'}`);
  
  // STEP 7: Return detailed verification result
  return NextResponse.json({
    ...result,
    donation: {
      id: donation.id,
      payment_id: donation.payment_id,
      amount_inr: donation.amount_inr,
      created_at: donation.created_at,
      status: donation.status,
      batched: true,
      batch_id: donation.anchor_batch_id,
      batch_status: batchInfo.status,
      leaf_index: donation.merkle_leaf_index,
      anchored: donation.anchored,
    },
    proof: {
      steps: proof.length,
      hashes: proof.map(p => p.hash.substring(0, 16) + '...'),
    },
  });
}

/**
 * POST endpoint - verify via request body
 */
export async function POST(req: NextRequest) {
  console.log('🔍 === VERIFY PROOF REQUEST (POST) ===');
  
  // SECURITY: Apply rate limiting for verification API
  const rateLimited = applyRateLimit(req, 'verification');
  if (rateLimited) return rateLimited;
  
  try {
    const body = await req.json();
    const { donationId, paymentId } = body;
    
    if (!donationId && !paymentId) {
      return NextResponse.json(
        { error: 'Either donationId or paymentId is required' },
        { status: 400 }
      );
    }
    
    return performVerification(donationId || null, paymentId || null);
    
  } catch (error) {
    console.error('❌ Unexpected error in verify-proof POST:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - verify via query parameters
 * Query params: ?donationId=xxx or ?paymentId=pay_xxx
 */
export async function GET(req: NextRequest) {
  console.log('🔍 === VERIFY PROOF REQUEST (GET) ===');
  
  // SECURITY: Apply rate limiting for verification API
  const rateLimited = applyRateLimit(req, 'verification');
  if (rateLimited) return rateLimited;
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const donationId = searchParams.get('donationId');
    const paymentId = searchParams.get('paymentId');
    
    if (!donationId && !paymentId) {
      return NextResponse.json(
        { error: 'Either donationId or paymentId query parameter is required' },
        { status: 400 }
      );
    }
    
    return performVerification(donationId, paymentId);
    
  } catch (error) {
    console.error('❌ Unexpected error in verify-proof GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
