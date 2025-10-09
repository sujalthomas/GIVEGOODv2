/**
 * Merkle Tree Types for Donation Batching
 * 
 * These types define the structure for creating cryptographic proofs
 * of donations that will be anchored to Solana blockchain.
 */

export interface DonationLeaf {
  id: string;
  amount_inr: number;
  currency: string;
  payment_id: string;
  upi_reference: string | null;
  created_at: string;
  payment_method: string | null;
  donor_name: string | null;
  anonymous: boolean | null;
}

export interface MerkleProof {
  /** Position of sibling hash (left or right) */
  position: 'left' | 'right';
  /** Hash value of sibling node */
  hash: string;
}

export interface BatchResult {
  /** UUID of created batch */
  batchId: string;
  /** Merkle root hash (hex string) */
  merkleRoot: string;
  /** Height of the Merkle tree */
  treeHeight: number;
  /** Number of donations in batch */
  donationCount: number;
  /** Total amount in batch (INR) */
  totalAmount: number;
  /** Donation IDs included in batch */
  donationIds: string[];
  /** Timestamp range of batch */
  batchStartTime: string;
  batchEndTime: string;
}

export interface VerificationResult {
  /** Whether the proof is valid */
  valid: boolean;
  /** Merkle root used for verification */
  merkleRoot: string;
  /** Leaf hash that was verified */
  leafHash: string;
  /** Error message if verification failed */
  error?: string;
}

