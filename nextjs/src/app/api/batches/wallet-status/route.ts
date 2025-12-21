/**
 * Wallet Status API Route
 * 
 * Check if the Solana anchor wallet is properly configured and funded.
 * This endpoint helps verify the setup before attempting to anchor batches.
 */

import { NextResponse } from 'next/server';
import { verifyWalletSetup, getSolanaConfig } from '@/lib/solana/anchor';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET() {
  console.log('🔍 === CHECKING WALLET STATUS ===');
  
  // SECURITY: Require admin authentication (wallet info is sensitive)
  const authError = await requireAdminAuth();
  if (authError) return authError;
  
  try {
    const config = getSolanaConfig();
    const walletStatus = await verifyWalletSetup();
    
    console.log(`Network: ${config.network}`);
    console.log(`Public Key: ${walletStatus.publicKey || 'N/A'}`);
    console.log(`Balance: ${walletStatus.balance?.toFixed(6)} SOL`);
    console.log(`Ready: ${walletStatus.ready}`);
    
    return NextResponse.json({
      ...walletStatus,
      network: config.network,
      rpcUrl: config.rpcUrl,
      message: walletStatus.ready 
        ? 'Wallet is configured and funded' 
        : walletStatus.error || 'Wallet setup incomplete',
    });
    
  } catch (error) {
    console.error('❌ Error checking wallet status:', error);
    
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : 'Failed to check wallet status',
      },
      { status: 500 }
    );
  }
}

