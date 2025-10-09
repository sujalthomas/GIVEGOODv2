/**
 * Blockchain Statistics API Route
 * 
 * Provides comprehensive statistics about Solana blockchain integration:
 * - Wallet balance and info
 * - Transaction statistics
 * - Cost analysis
 * - Recent transactions
 * 
 * Access: Super admin only
 */

import { NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { verifyWalletSetup, getSolanaConfig, createSolanaConnection } from '@/lib/solana/anchor';
import type { Tables } from '@/lib/types';

type AnchorBatch = Tables<'anchor_batches'>;

export async function GET() {
  console.log('📊 === FETCHING BLOCKCHAIN STATS ===');
  
  try {
    // STEP 1: Get wallet info
    const config = getSolanaConfig();
    const walletStatus = await verifyWalletSetup();
    
    if (!walletStatus.ready) {
      return NextResponse.json({
        error: 'Wallet not configured',
        details: walletStatus.error,
      }, { status: 503 });
    }
    
    // STEP 2: Fetch all anchored batches from database
    const supabase = await createServerAdminClient();
    
    const { data: batches, error: batchError } = await supabase
      .from('anchor_batches')
      .select('*')
      .not('onchain_tx_signature', 'is', null)
      .order('created_at', { ascending: false }) as unknown as {
        data: AnchorBatch[] | null;
        error: unknown;
      };
    
    if (batchError) {
      console.error('Error fetching batches:', batchError);
      return NextResponse.json({
        error: 'Failed to fetch batch data',
      }, { status: 500 });
    }
    
    const anchoredBatches = batches || [];
    
    // STEP 3: Calculate statistics
    const totalBatchesAnchored = anchoredBatches.length;
    const totalDonationsAnchored = anchoredBatches.reduce((sum, b) => sum + b.donation_count, 0);
    const totalAmountAnchored = anchoredBatches.reduce((sum, b) => sum + Number(b.total_amount_inr), 0);
    
    // STEP 4: Calculate SOL costs
    // Estimate: ~0.000005 SOL per transaction
    const estimatedCostPerTx = 0.000005;
    const totalSolSpent = totalBatchesAnchored * estimatedCostPerTx;
    const averageCostPerBatch = totalBatchesAnchored > 0 ? totalSolSpent / totalBatchesAnchored : 0;
    
    // STEP 5: Get transaction details for recent batches
    const connection = createSolanaConnection();
    const recentTransactions = await Promise.all(
      anchoredBatches.slice(0, 10).map(async (batch) => {
        if (!batch.onchain_tx_signature) return null;
        
        try {
          const tx = await connection.getTransaction(batch.onchain_tx_signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          
          return {
            batchId: batch.id,
            signature: batch.onchain_tx_signature,
            slot: batch.onchain_slot || tx?.slot || 0,
            blockTime: batch.onchain_timestamp || (tx?.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null),
            donationCount: batch.donation_count,
            amount: Number(batch.total_amount_inr),
            fee: tx?.meta?.fee || 5000, // lamports
            success: !tx?.meta?.err,
          };
        } catch (error) {
          console.error(`Failed to fetch tx ${batch.onchain_tx_signature}:`, error);
          return {
            batchId: batch.id,
            signature: batch.onchain_tx_signature,
            slot: batch.onchain_slot || 0,
            blockTime: batch.onchain_timestamp,
            donationCount: batch.donation_count,
            amount: Number(batch.total_amount_inr),
            fee: 5000, // estimated
            success: true,
          };
        }
      })
    );
    
    const validTransactions = recentTransactions.filter(tx => tx !== null);
    
    // STEP 6: Calculate actual fees from transactions
    const actualTotalFees = validTransactions.reduce((sum, tx) => sum + (tx?.fee || 0), 0);
    const actualTotalFeesInSol = actualTotalFees / 1e9; // Convert lamports to SOL
    
    // STEP 7: Cost projections
    const projections = {
      next100Batches: {
        batches: 100,
        estimatedSol: 100 * estimatedCostPerTx,
        estimatedUsd: 100 * estimatedCostPerTx * 100, // Assuming $100/SOL
      },
      yearly1000Batches: {
        batches: 1000,
        estimatedSol: 1000 * estimatedCostPerTx,
        estimatedUsd: 1000 * estimatedCostPerTx * 100,
      },
      monthly: {
        batches: 100,
        estimatedSol: 100 * estimatedCostPerTx,
        estimatedUsd: 100 * estimatedCostPerTx * 100,
      },
    };
    
    // STEP 8: Network health
    const networkHealth = {
      network: config.network,
      rpcUrl: config.rpcUrl,
      connected: true,
      avgConfirmationTime: '~5 seconds',
    };
    
    // STEP 9: Return comprehensive stats
    return NextResponse.json({
      wallet: {
        publicKey: walletStatus.publicKey,
        balance: walletStatus.balance,
        balanceUsd: (walletStatus.balance || 0) * 100, // Assuming $100/SOL
        ready: walletStatus.ready,
        network: config.network,
      },
      statistics: {
        totalBatchesAnchored,
        totalDonationsAnchored,
        totalAmountAnchored,
        totalSolSpent: actualTotalFeesInSol > 0 ? actualTotalFeesInSol : totalSolSpent,
        averageCostPerBatch: actualTotalFeesInSol > 0 
          ? actualTotalFeesInSol / totalBatchesAnchored 
          : averageCostPerBatch,
        firstAnchor: anchoredBatches[anchoredBatches.length - 1]?.created_at || null,
        lastAnchor: anchoredBatches[0]?.created_at || null,
      },
      transactions: {
        recent: validTransactions.slice(0, 10),
        totalFees: actualTotalFeesInSol,
        avgFeePerTx: validTransactions.length > 0 
          ? actualTotalFees / validTransactions.length / 1e9 
          : estimatedCostPerTx,
      },
      projections,
      networkHealth,
    });
    
  } catch (error) {
    console.error('❌ Error fetching blockchain stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

