/**
 * Solana Blockchain Anchoring Utilities
 * 
 * This module handles anchoring Merkle roots to the Solana blockchain
 * using the SPL Memo program for immutable, timestamped records.
 * 
 * Security Notes:
 * - Private key MUST be stored securely in environment variables
 * - Never log or expose private keys
 * - Use devnet for testing before mainnet
 * 
 * Cost Analysis:
 * - Each transaction: ~0.000005 SOL (~$0.0005 at $100/SOL)
 * - 1000 batches/year: ~$0.50
 * - Very affordable for transparency!
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import type { SolanaConfig, AnchorResult, MemoData, TransactionStatus } from './types';

/**
 * Get Solana configuration based on environment
 */
export function getSolanaConfig(): SolanaConfig {
  const network = (process.env.SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'devnet' | 'testnet';
  
  const rpcUrls = {
    'mainnet-beta': process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
  };
  
  const explorerUrls = {
    'mainnet-beta': 'https://solscan.io',
    'devnet': 'https://solscan.io',
    'testnet': 'https://solscan.io',
  };
  
  return {
    rpcUrl: rpcUrls[network],
    network,
    explorerBaseUrl: explorerUrls[network],
  };
}

/**
 * Initialize connection to Solana network
 */
export function createSolanaConnection(): Connection {
  const config = getSolanaConfig();
  console.log(`🔗 Connecting to Solana ${config.network}...`);
  
  return new Connection(config.rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000, // 60 seconds
  });
}

/**
 * Load keypair from environment variable
 * 
 * SECURITY: The private key should be stored as a base64 encoded string
 * or as a JSON array of numbers in the environment variable.
 * 
 * Generate a new keypair:
 * ```bash
 * solana-keygen new --outfile ~/my-wallet.json
 * cat ~/my-wallet.json | base64
 * ```
 */
export function loadAnchorKeypair(): Keypair {
  const privateKeyEnv = process.env.SOLANA_ANCHOR_PRIVATE_KEY;
  
  if (!privateKeyEnv) {
    throw new Error('SOLANA_ANCHOR_PRIVATE_KEY environment variable not set');
  }
  
  try {
    // Try parsing as JSON array first (Solana CLI format)
    const privateKeyArray = JSON.parse(privateKeyEnv);
    if (Array.isArray(privateKeyArray)) {
      return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    }
    
    // Try parsing as base64
    const privateKeyBuffer = Buffer.from(privateKeyEnv, 'base64');
    return Keypair.fromSecretKey(privateKeyBuffer);
  } catch {
    console.error('❌ Failed to parse SOLANA_ANCHOR_PRIVATE_KEY');
    throw new Error('Invalid SOLANA_ANCHOR_PRIVATE_KEY format. Must be JSON array or base64.');
  }
}

/**
 * Create memo data for blockchain
 * This data will be permanently stored on Solana
 */
export function createMemoData(
  batchId: string,
  merkleRoot: string,
  donationCount: number,
  totalAmount: number
): string {
  const memoData: MemoData = {
    type: 'GIVEGOOD_BATCH',
    version: '1.0',
    batchId,
    merkleRoot,
    donationCount,
    totalAmount,
    timestamp: Date.now(),
  };
  
  // Create compact JSON string (Solana memo has size limits)
  return JSON.stringify(memoData);
}

/**
 * Create a memo instruction
 * 
 * The SPL Memo program stores arbitrary data on-chain.
 * Program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
 */
function createMemoInstruction(
  memoText: string,
  signer: PublicKey
): TransactionInstruction {
  const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, 'utf-8'),
  });
}

/**
 * Anchor a batch to Solana blockchain
 * 
 * This function:
 * 1. Creates a memo transaction with the merkle root
 * 2. Signs it with the anchor wallet
 * 3. Sends it to Solana
 * 4. Waits for confirmation
 * 5. Returns the transaction signature
 * 
 * @param batchId - UUID of the batch
 * @param merkleRoot - Merkle root hash (hex string)
 * @param donationCount - Number of donations in batch
 * @param totalAmount - Total amount in INR
 * @returns AnchorResult with signature or error
 */
export async function anchorBatchToSolana(
  batchId: string,
  merkleRoot: string,
  donationCount: number,
  totalAmount: number
): Promise<AnchorResult> {
  console.log('⛓️ === ANCHORING TO SOLANA ===');
  console.log(`📦 Batch: ${batchId}`);
  console.log(`🌳 Merkle Root: ${merkleRoot.substring(0, 16)}...`);
  console.log(`💰 Amount: ₹${totalAmount.toLocaleString()}`);
  
  try {
    // STEP 1: Initialize connection and load keypair
    const connection = createSolanaConnection();
    const anchorWallet = loadAnchorKeypair();
    const walletPublicKey = anchorWallet.publicKey;
    
    console.log(`🔑 Anchor Wallet: ${walletPublicKey.toBase58()}`);
    
    // STEP 2: Check wallet balance
    const balance = await connection.getBalance(walletPublicKey);
    const solBalance = balance / 1e9; // Convert lamports to SOL
    console.log(`💳 Wallet Balance: ${solBalance.toFixed(6)} SOL`);
    
    if (balance < 10000) { // Less than 0.00001 SOL
      return {
        success: false,
        error: `Insufficient balance: ${solBalance.toFixed(6)} SOL. Need at least 0.00001 SOL for transaction.`,
      };
    }
    
    // STEP 3: Create memo data
    const memoText = createMemoData(batchId, merkleRoot, donationCount, totalAmount);
    console.log(`📝 Memo size: ${memoText.length} bytes`);
    
    if (memoText.length > 566) {
      // Solana memo program has a size limit
      return {
        success: false,
        error: `Memo data too large: ${memoText.length} bytes (max 566)`,
      };
    }
    
    // STEP 4: Create transaction
    const transaction = new Transaction();
    const memoInstruction = createMemoInstruction(memoText, walletPublicKey);
    transaction.add(memoInstruction);
    
    console.log('🔨 Transaction created, sending...');
    
    // STEP 5: Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [anchorWallet],
      {
        commitment: 'confirmed',
        maxRetries: 3,
      }
    );
    
    console.log(`✅ Transaction confirmed!`);
    console.log(`📝 Signature: ${signature}`);
    
    // STEP 6: Get transaction details
    const txDetails = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    
    const slot = txDetails?.slot || 0;
    const blockTime = txDetails?.blockTime || 0;
    
    console.log(`🎰 Slot: ${slot}`);
    console.log(`⏰ Block Time: ${new Date(blockTime * 1000).toISOString()}`);
    
    const config = getSolanaConfig();
    const explorerUrl = `${config.explorerBaseUrl}/tx/${signature}${config.network !== 'mainnet-beta' ? `?cluster=${config.network}` : ''}`;
    console.log(`🔍 Explorer: ${explorerUrl}`);
    
    return {
      success: true,
      signature,
      slot,
      blockTime,
      confirmations: 1,
    };
    
  } catch (error) {
    console.error('❌ Solana anchoring failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during Solana anchoring',
    };
  }
}

/**
 * Get transaction status from Solana
 */
export async function getTransactionStatus(signature: string): Promise<TransactionStatus | null> {
  try {
    const connection = createSolanaConnection();
    
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    
    if (!status.value) {
      return null;
    }
    
    const txDetails = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    
    return {
      signature,
      slot: txDetails?.slot || 0,
      blockTime: txDetails?.blockTime || null,
      confirmationStatus: status.value.confirmationStatus || 'processed',
      err: status.value.err,
    };
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return null;
  }
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(signature: string): string {
  const config = getSolanaConfig();
  return `${config.explorerBaseUrl}/tx/${signature}${config.network !== 'mainnet-beta' ? `?cluster=${config.network}` : ''}`;
}

/**
 * Verify wallet is funded and ready
 */
export async function verifyWalletSetup(): Promise<{
  ready: boolean;
  publicKey?: string;
  balance?: number;
  error?: string;
}> {
  try {
    const connection = createSolanaConnection();
    const anchorWallet = loadAnchorKeypair();
    const publicKey = anchorWallet.publicKey.toBase58();
    
    const balance = await connection.getBalance(anchorWallet.publicKey);
    const solBalance = balance / 1e9;
    
    const ready = balance >= 10000; // At least 0.00001 SOL
    
    return {
      ready,
      publicKey,
      balance: solBalance,
      error: ready ? undefined : 'Insufficient balance for transactions',
    };
  } catch (error) {
    return {
      ready: false,
      error: error instanceof Error ? error.message : 'Failed to verify wallet',
    };
  }
}

