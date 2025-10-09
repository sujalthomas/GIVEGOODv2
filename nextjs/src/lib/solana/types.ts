/**
 * Solana Integration Types
 * 
 * Type definitions for Solana blockchain anchoring
 */

import type { TransactionSignature } from '@solana/web3.js';

/**
 * Configuration for Solana network
 */
export interface SolanaConfig {
  rpcUrl: string;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  explorerBaseUrl: string;
}

/**
 * Result of anchoring a batch to Solana
 */
export interface AnchorResult {
  success: boolean;
  signature?: TransactionSignature;
  slot?: number;
  blockTime?: number;
  error?: string;
  confirmations?: number;
}

/**
 * Memo data structure for blockchain
 */
export interface MemoData {
  type: 'GIVEGOOD_BATCH';
  version: '1.0';
  batchId: string;
  merkleRoot: string;
  donationCount: number;
  totalAmount: number;
  timestamp: number;
}

/**
 * Transaction status from Solana
 */
export interface TransactionStatus {
  signature: string;
  slot: number;
  blockTime: number | null;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  err: unknown | null;
}

