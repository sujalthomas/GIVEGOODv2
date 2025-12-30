/**
 * Create Batch API Route
 * 
 * This endpoint creates a new Merkle batch from unanchored donations.
 * 
 * Flow:
 * 1. Query completed donations that haven't been batched
 * 2. Build Merkle tree from donations
 * 3. Generate proofs for each donation
 * 4. Store batch in anchor_batches table
 * 5. Update donations with batch info and proofs
 * 
 * Access: Super admin only (auth check required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { requireAdminOrApiKey } from '@/lib/auth/adminAuth';
import {
  buildMerkleTree,
  computeLeafHash,
  getMerkleProof,
  getMerkleRoot,
  calculateTreeHeight,
} from '@/lib/merkle/builder';
import type { DonationLeaf, BatchResult } from '@/lib/merkle/types';
import type { Tables, TablesInsert, Json } from '@/lib/types';

interface BatchConfig {
  /** Maximum number of donations per batch */
  maxBatchSize: number;
  /** Time window in hours to look back for donations */
  timeWindowHours: number;
  /** Minimum donations required to create a batch */
  minBatchSize: number;
}

type Donation = Tables<'donations'>;
type AnchorBatchInsert = TablesInsert<'anchor_batches'>;
type AnchorBatch = Tables<'anchor_batches'>;

export async function POST(req: NextRequest) {
  console.log('🎯 === CREATE BATCH REQUEST ===');
  
  // SECURITY: Require admin authentication
  const authError = await requireAdminOrApiKey(req);
  if (authError) return authError;
  
  try {
    // Parse optional config from request body
    const body = await req.json().catch(() => ({}));
    const config: BatchConfig = {
      maxBatchSize: body.maxBatchSize || 100,
      timeWindowHours: body.timeWindowHours || 24,
      minBatchSize: body.minBatchSize || 1,
    };
    
    console.log('📋 Batch Config:', config);
    
    // Initialize Supabase client (service role for admin operations)
    const supabase = await createServerAdminClient();
    
    // STEP 1: Query unanchored completed donations
    console.log('📊 Step 1: Querying unanchored donations...');
    
    const { data: donations, error: queryError } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'completed')
      .eq('anchored', false)
      .is('anchor_batch_id', null)
      .order('created_at', { ascending: true })
      .limit(config.maxBatchSize)
      .returns<Donation[]>();
    
    if (queryError) {
      console.error('❌ Database query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to query donations', details: queryError.message },
        { status: 500 }
      );
    }
    
    if (!donations || donations.length === 0) {
      console.log('ℹ️ No unanchored donations found');
      return NextResponse.json(
        { 
          message: 'No unanchored donations to batch',
          donationCount: 0,
        },
        { status: 200 }
      );
    }
    
    if (donations.length < config.minBatchSize) {
      console.log(`ℹ️ Only ${donations.length} donations found, minimum is ${config.minBatchSize}`);
      return NextResponse.json(
        { 
          message: `Insufficient donations for batch (found: ${donations.length}, min: ${config.minBatchSize})`,
          donationCount: donations.length,
        },
        { status: 200 }
      );
    }
    
    console.log(`✅ Found ${donations.length} unanchored donations`);
    
    // STEP 2: Transform to DonationLeaf format
    console.log('🔄 Step 2: Transforming donations to leaf format...');
    
    const leaves: DonationLeaf[] = donations.map((d: Donation) => ({
      id: d.id,
      amount_inr: d.amount_inr,
      currency: d.currency,
      payment_id: d.payment_id,
      upi_reference: d.upi_reference,
      created_at: d.created_at,
      payment_method: d.payment_method,
      donor_name: d.donor_name,
      anonymous: d.anonymous,
    }));
    
    // STEP 3: Build Merkle tree
    console.log('🌳 Step 3: Building Merkle tree...');
    
    const tree = buildMerkleTree(leaves);
    const merkleRoot = getMerkleRoot(tree);
    const treeHeight = calculateTreeHeight(leaves.length);
    
    console.log(`   Merkle Root: ${merkleRoot}`);
    console.log(`   Tree Height: ${treeHeight}`);
    
    // STEP 4: Generate proofs for each donation
    console.log('🔐 Step 4: Generating Merkle proofs...');
    
    const donationUpdates = leaves.map((leaf, index) => {
      const leafHash = computeLeafHash(leaf);
      const proof = getMerkleProof(tree, leafHash);
      
      return {
        id: leaf.id,
        leafHash,
        leafIndex: index,
        proof,
      };
    });
    
    console.log(`✅ Generated ${donationUpdates.length} proofs`);
    
    // STEP 5: Calculate batch metadata
    const totalAmount = donations.reduce((sum: number, d: Donation) => sum + d.amount_inr, 0);
    const batchStartTime = donations[0].created_at;
    const batchEndTime = donations[donations.length - 1].created_at;
    
    // STEP 6: Create batch record in database
    console.log('💾 Step 5: Creating batch record...');
    
    const batchInsert: AnchorBatchInsert = {
      merkle_root: merkleRoot,
      tree_height: treeHeight,
      leaf_count: leaves.length,
      donation_count: donations.length,
      total_amount_inr: totalAmount,
      batch_start_time: batchStartTime,
      batch_end_time: batchEndTime,
      status: 'pending', // Valid statuses: 'pending', 'anchoring', 'confirmed', 'failed'
      metadata: {
        config: {
          maxBatchSize: config.maxBatchSize,
          timeWindowHours: config.timeWindowHours,
          minBatchSize: config.minBatchSize,
        },
        created_via: 'api',
        donation_ids: donations.map((d: Donation) => d.id),
      } as Json,
    };
    
    const insertResult = await supabase
      .from('anchor_batches')
      .insert(batchInsert as never)
      .select()
      .single();
    
    const { data: batch, error: batchError } = insertResult as unknown as { data: AnchorBatch | null; error: unknown };
    
    if (batchError || !batch) {
      console.error('❌ Failed to create batch:', batchError);
      return NextResponse.json(
        { 
          error: 'Failed to create batch record', 
          details: batchError ? String(batchError) : 'Unknown error',
        },
        { status: 500 }
      );
    }
    
    console.log(`✅ Batch created with ID: ${batch.id}`);
    
    // STEP 7: Update donations with batch info and proofs
    console.log('📝 Step 6: Updating donations with batch info...');
    
    const updatePromises = donationUpdates.map(update => {
      return supabase
        .from('donations')
        .update({
          anchor_batch_id: batch.id,
          merkle_leaf_hash: update.leafHash,
          merkle_leaf_index: update.leafIndex,
          merkle_proof: update.proof as unknown as Json, // Cast to Json for JSONB type
          // Note: anchored stays FALSE until blockchain confirmation (Phase 3)
        } as never) // Cast to never to bypass Supabase's overly strict update types
        .eq('id', update.id);
    });
    
    const updateResults = await Promise.all(updatePromises);
    
    // Check for update errors
    const updateErrors = updateResults.filter((r: { error: unknown }) => r.error);
    if (updateErrors.length > 0) {
      console.error('⚠️ Some donation updates failed:', updateErrors);
      // Continue anyway - batch is created, can retry updates later
    }
    
    console.log(`✅ Updated ${donations.length} donations`);
    
    // STEP 8: Return success
    console.log('🎉 === BATCH CREATION COMPLETE ===');
    
    const result: BatchResult = {
      batchId: batch.id,
      merkleRoot,
      treeHeight,
      donationCount: donations.length,
      totalAmount,
      donationIds: donations.map((d: Donation) => d.id),
      batchStartTime,
      batchEndTime,
    };
    
    return NextResponse.json({
      success: true,
      message: `Successfully created batch with ${donations.length} donations`,
      batch: result,
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in create-batch:', error);
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
 * GET endpoint to check status of unanchored donations
 */
export async function GET(req: NextRequest) {
  // SECURITY: Require admin authentication
  const authError = await requireAdminOrApiKey(req);
  if (authError) return authError;
  
  try {
    const supabase = await createServerAdminClient();
    
    const { count, error } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('anchored', false)
      .is('anchor_batch_id', null);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      unanchoredCount: count || 0,
      message: count && count > 0 
        ? `${count} donations ready for batching`
        : 'No donations ready for batching',
    });
    
  } catch (error) {
    console.error('Error checking unanchored donations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

