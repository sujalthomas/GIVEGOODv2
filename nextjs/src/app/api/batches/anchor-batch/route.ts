/**
 * Anchor Batch to Solana Blockchain API Route
 * 
 * This route anchors a pending batch to the Solana blockchain
 * by creating a memo transaction with the merkle root.
 * 
 * Flow:
 * 1. Fetch the batch (must be status='pending')
 * 2. Verify batch has merkle_root
 * 3. Create Solana memo transaction
 * 4. Update batch status to 'anchoring'
 * 5. Send transaction to blockchain
 * 6. Update batch with transaction details
 * 7. Set status to 'confirmed' or 'failed'
 * 
 * Access: Super admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { requireAdminOrApiKey } from '@/lib/auth/adminAuth';
import { anchorBatchToSolana, getExplorerUrl } from '@/lib/solana/anchor';
import type { Tables } from '@/lib/types';

type AnchorBatch = Tables<'anchor_batches'>;

export async function POST(req: NextRequest) {
  console.log('⛓️ === ANCHOR BATCH TO BLOCKCHAIN REQUEST ===');
  
  // SECURITY: Require admin authentication
  const authError = await requireAdminOrApiKey(req);
  if (authError) return authError;
  
  try {
    const body = await req.json();
    const { batchId } = body;
    
    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Fetching batch: ${batchId}`);
    
    // Initialize Supabase admin client
    const supabase = await createServerAdminClient();
    
    // STEP 1: Fetch the batch
    const { data: batch, error: fetchError } = await supabase
      .from('anchor_batches')
      .select('*')
      .eq('id', batchId)
      .single() as unknown as { data: AnchorBatch | null; error: unknown };
    
    if (fetchError || !batch) {
      console.error('❌ Batch not found:', fetchError);
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Found batch with status: ${batch.status}`);
    
    // STEP 2: Validate batch can be anchored
    if (batch.status !== 'pending') {
      return NextResponse.json(
        { 
          error: `Cannot anchor batch with status: ${batch.status}. Only 'pending' batches can be anchored.`,
          currentStatus: batch.status,
        },
        { status: 400 }
      );
    }
    
    if (!batch.merkle_root) {
      return NextResponse.json(
        { error: 'Batch does not have a merkle root' },
        { status: 400 }
      );
    }
    
    // STEP 3: Check if already anchored (idempotency)
    if (batch.onchain_tx_signature) {
      console.log('ℹ️ Batch already has transaction signature');
      return NextResponse.json({
        success: true,
        message: 'Batch already anchored',
        batch: {
          id: batch.id,
          status: batch.status,
          signature: batch.onchain_tx_signature,
          explorerUrl: getExplorerUrl(batch.onchain_tx_signature),
        },
      });
    }
    
    // STEP 4: Update status to 'anchoring' (optimistic)
    console.log('🔄 Updating batch status to "anchoring"...');
    const { error: statusError } = await supabase
      .from('anchor_batches')
      .update({
        status: 'anchoring',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', batchId);
    
    if (statusError) {
      console.error('❌ Failed to update status:', statusError);
      return NextResponse.json(
        { error: 'Failed to update batch status' },
        { status: 500 }
      );
    }
    
    // STEP 5: Anchor to Solana blockchain
    console.log('⛓️ Anchoring to Solana...');
    const anchorResult = await anchorBatchToSolana(
      batch.id,
      batch.merkle_root,
      batch.donation_count,
      Number(batch.total_amount_inr)
    );
    
    if (!anchorResult.success) {
      // STEP 6a: Anchoring failed - update batch status
      console.error('❌ Anchoring failed:', anchorResult.error);
      
      const retryCount = (batch.retry_count || 0) + 1;
      
      await supabase
        .from('anchor_batches')
        .update({
          status: 'failed',
          error_message: anchorResult.error || 'Unknown anchoring error',
          retry_count: retryCount,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', batchId);
      
      return NextResponse.json(
        { 
          error: anchorResult.error,
          batch: {
            id: batch.id,
            status: 'failed',
            retryCount,
          },
        },
        { status: 500 }
      );
    }
    
    // STEP 6b: Anchoring succeeded - update batch with blockchain data
    console.log('✅ Anchoring successful!');
    
    const { error: updateError } = await supabase
      .from('anchor_batches')
      .update({
        status: 'confirmed',
        onchain_tx_signature: anchorResult.signature,
        onchain_slot: anchorResult.slot ? Number(anchorResult.slot) : null,
        onchain_timestamp: anchorResult.blockTime 
          ? new Date(anchorResult.blockTime * 1000).toISOString()
          : null,
        error_message: null, // Clear any previous errors
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', batchId);
    
    if (updateError) {
      console.error('❌ Failed to update batch with blockchain data:', updateError);
      // Transaction succeeded but DB update failed - this is recoverable
      // The transaction signature is in the response
    }
    
    // STEP 7: Update all donations in this batch to mark as anchored
    console.log('📝 Updating donations as anchored...');
    const { error: donationError } = await supabase
      .from('donations')
      .update({
        anchored: true,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('anchor_batch_id', batchId);
    
    if (donationError) {
      console.error('⚠️ Failed to update donations:', donationError);
      // Non-critical - batch is anchored successfully
    }
    
    console.log('🎉 === BATCH ANCHORED SUCCESSFULLY ===');
    
    const explorerUrl = getExplorerUrl(anchorResult.signature!);
    
    return NextResponse.json({
      success: true,
      message: 'Batch anchored to Solana blockchain successfully',
      batch: {
        id: batch.id,
        status: 'confirmed',
        signature: anchorResult.signature,
        slot: anchorResult.slot,
        blockTime: anchorResult.blockTime,
        explorerUrl,
      },
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in anchor-batch:', error);
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
 * GET endpoint to check if batch can be anchored
 */
export async function GET(req: NextRequest) {
  // SECURITY: Require admin authentication
  const authError = await requireAdminOrApiKey(req);
  if (authError) return authError;
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const batchId = searchParams.get('batchId');
    
    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID query parameter is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerAdminClient();
    
    const { data: batch, error } = await supabase
      .from('anchor_batches')
      .select('id, status, merkle_root, onchain_tx_signature, donation_count, total_amount_inr')
      .eq('id', batchId)
      .single() as unknown as {
        data: {
          id: string;
          status: string;
          merkle_root: string | null;
          onchain_tx_signature: string | null;
          donation_count: number;
          total_amount_inr: number;
        } | null;
        error: unknown;
      };
    
    if (error || !batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }
    
    const canAnchor = batch.status === 'pending' && batch.merkle_root && !batch.onchain_tx_signature;
    const isAnchored = !!batch.onchain_tx_signature;
    
    return NextResponse.json({
      batch: {
        id: batch.id,
        status: batch.status,
        hasMerkleRoot: !!batch.merkle_root,
        isAnchored,
        signature: batch.onchain_tx_signature,
      },
      canAnchor,
      explorerUrl: batch.onchain_tx_signature ? getExplorerUrl(batch.onchain_tx_signature) : null,
    });
    
  } catch (error) {
    console.error('Error checking anchor status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

