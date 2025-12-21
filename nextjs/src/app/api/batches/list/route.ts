/**
 * List Batches API Route
 * 
 * GET /api/batches/list - List all batches with optional filtering
 * GET /api/batches/list?batchId=xxx - Get specific batch details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSSRClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(req: NextRequest) {
  // SECURITY: Require admin authentication for full batch list
  const authError = await requireAdminAuth();
  if (authError) return authError;
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const batchId = searchParams.get('batchId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const supabase = await createSSRClient();
    
    // Get specific batch with donations
    if (batchId) {
      const { data: batch, error: batchError } = await supabase
        .from('anchor_batches')
        .select('*')
        .eq('id', batchId)
        .single();
      
      if (batchError || !batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      
      // Get donations in this batch
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select('id, payment_id, amount_inr, created_at, donor_name, anonymous, merkle_leaf_index, merkle_leaf_hash')
        .eq('anchor_batch_id', batchId)
        .order('merkle_leaf_index', { ascending: true });
      
      if (donationsError) {
        console.error('Error fetching batch donations:', donationsError);
      }
      
      return NextResponse.json({
        batch,
        donations: donations || [],
      });
    }
    
    // List all batches
    let query = supabase
      .from('anchor_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: batches, error: listError } = await query;
    
    if (listError) {
      console.error('Error listing batches:', listError);
      return NextResponse.json(
        { error: 'Failed to fetch batches', details: listError.message },
        { status: 500 }
      );
    }
    
    // Get total counts
    const { count: totalCount } = await supabase
      .from('anchor_batches')
      .select('*', { count: 'exact', head: true });
    
    const { count: pendingCount } = await supabase
      .from('anchor_batches')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'anchoring']);
    
    const { count: confirmedCount } = await supabase
      .from('anchor_batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed');
    
    return NextResponse.json({
      batches: batches || [],
      stats: {
        total: totalCount || 0,
        pending: pendingCount || 0,
        anchored: confirmedCount || 0,
      },
    });
    
  } catch (error) {
    console.error('Error in list batches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

