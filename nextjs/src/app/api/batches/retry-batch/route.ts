/**
 * Retry Batch API Route
 * 
 * Retries a failed batch with exponential backoff.
 * Updates retry_count and error_message in the database.
 * 
 * Flow:
 * 1. Fetch the failed batch
 * 2. Check if retry limit exceeded
 * 3. Calculate exponential backoff delay
 * 4. Update batch status to 'pending' for retry
 * 5. Increment retry_count
 * 
 * Access: Super admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { requireAdminOrApiKey } from '@/lib/auth/adminAuth';
import type { Tables } from '@/lib/types';

type AnchorBatch = Tables<'anchor_batches'>;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second

/**
 * Calculate exponential backoff delay
 * Formula: BASE_DELAY * (2 ^ retry_count)
 * 
 * Example delays:
 * - Retry 1: 2 seconds
 * - Retry 2: 4 seconds
 * - Retry 3: 8 seconds
 * - Retry 4: 16 seconds
 * - Retry 5: 32 seconds
 */
function calculateBackoffDelay(retryCount: number): number {
  return BASE_DELAY_MS * Math.pow(2, retryCount);
}

export async function POST(req: NextRequest) {
  console.log('🔄 === RETRY BATCH REQUEST ===');
  
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
    
    // STEP 2: Check if batch is in a retryable state
    if (batch.status !== 'failed') {
      return NextResponse.json(
        { error: `Cannot retry batch with status: ${batch.status}. Only 'failed' batches can be retried.` },
        { status: 400 }
      );
    }
    
    // STEP 3: Check retry limit
    const currentRetryCount = batch.retry_count || 0;
    
    if (currentRetryCount >= MAX_RETRIES) {
      console.error(`❌ Retry limit exceeded: ${currentRetryCount}/${MAX_RETRIES}`);
      return NextResponse.json(
        { 
          error: `Retry limit exceeded. Batch has failed ${currentRetryCount} times.`,
          maxRetries: MAX_RETRIES,
          currentRetries: currentRetryCount,
        },
        { status: 400 }
      );
    }
    
    // STEP 4: Calculate backoff delay
    const backoffDelay = calculateBackoffDelay(currentRetryCount);
    const nextRetryCount = currentRetryCount + 1;
    
    console.log(`⏱️ Retry ${nextRetryCount}/${MAX_RETRIES} with ${backoffDelay}ms backoff`);
    
    // STEP 5: Update batch for retry
    const { error: updateError } = await supabase
      .from('anchor_batches')
      .update({
        status: 'pending', // Reset to pending for retry
        retry_count: nextRetryCount,
        error_message: null, // Clear previous error
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', batchId);
    
    if (updateError) {
      console.error('❌ Failed to update batch:', updateError);
      return NextResponse.json(
        { error: 'Failed to update batch for retry' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Batch updated for retry ${nextRetryCount}/${MAX_RETRIES}`);
    
    // STEP 6: Return success with retry info
    return NextResponse.json({
      success: true,
      message: `Batch queued for retry ${nextRetryCount}/${MAX_RETRIES}`,
      batch: {
        id: batch.id,
        status: 'pending',
        retryCount: nextRetryCount,
        maxRetries: MAX_RETRIES,
        backoffDelayMs: backoffDelay,
        estimatedRetryTime: new Date(Date.now() + backoffDelay).toISOString(),
      },
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in retry-batch:', error);
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
 * GET endpoint to get retry info for a batch
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
    
    const result = await supabase
      .from('anchor_batches')
      .select('id, status, retry_count, error_message')
      .eq('id', batchId)
      .single() as unknown as {
        data: { 
          id: string; 
          status: string; 
          retry_count: number | null; 
          error_message: string | null;
        } | null;
        error: unknown;
      };
    
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }
    
    const batch = result.data;
    const retryCount = batch.retry_count || 0;
    const canRetry = batch.status === 'failed' && retryCount < MAX_RETRIES;
    const nextBackoffDelay = calculateBackoffDelay(retryCount);
    
    return NextResponse.json({
      batch: {
        id: batch.id,
        status: batch.status,
        retryCount,
        errorMessage: batch.error_message,
      },
      retryInfo: {
        canRetry,
        maxRetries: MAX_RETRIES,
        remainingRetries: MAX_RETRIES - retryCount,
        nextBackoffDelayMs: canRetry ? nextBackoffDelay : null,
      },
    });
    
  } catch (error) {
    console.error('Error getting retry info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

