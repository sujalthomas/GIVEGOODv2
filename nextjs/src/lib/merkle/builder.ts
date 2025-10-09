/**
 * Merkle Tree Builder for Donation Batching
 * 
 * This module creates cryptographic Merkle trees from donations.
 * Each donation becomes a leaf node, and the root provides an immutable
 * fingerprint of all donations in the batch.
 * 
 * The Merkle root will be anchored to Solana blockchain for permanent transparency.
 */

import { MerkleTree } from 'merkletreejs';
import crypto from 'crypto';
import type { DonationLeaf, MerkleProof } from './types';

/**
 * Serialize a donation into canonical string format.
 * This format MUST remain consistent to ensure proof verification works.
 * 
 * Format: id|amount|currency|payment_id|upi_ref|timestamp|method|donor|anon
 * Example: "abc-123|1000.00|INR|pay_xyz|UPI123|2025-02-02T10:30:00Z|upi|John|false"
 */
export function serializeDonation(donation: DonationLeaf): string {
  const parts = [
    donation.id,
    donation.amount_inr.toFixed(2), // Always 2 decimal places for consistency
    donation.currency,
    donation.payment_id,
    donation.upi_reference || 'NULL', // Explicit NULL for empty values
    donation.created_at,
    donation.payment_method || 'NULL',
    donation.donor_name || 'ANONYMOUS',
    donation.anonymous ? 'true' : 'false',
  ];
  
  return parts.join('|');
}

/**
 * Compute SHA-256 hash of a donation leaf.
 * Returns hex string representation.
 */
export function computeLeafHash(donation: DonationLeaf): string {
  const serialized = serializeDonation(donation);
  const hash = crypto.createHash('sha256').update(serialized).digest('hex');
  
  console.log(`🌿 Leaf Hash: ${hash.substring(0, 16)}... for donation ${donation.id}`);
  
  return hash;
}

/**
 * Build a Merkle tree from an array of donations.
 * Uses SHA-256 hashing and sorts pairs for consistent tree structure.
 * 
 * @param donations - Array of donation objects
 * @returns MerkleTree instance
 */
export function buildMerkleTree(donations: DonationLeaf[]): MerkleTree {
  console.log(`🌳 Building Merkle tree for ${donations.length} donations...`);
  
  if (donations.length === 0) {
    throw new Error('Cannot build Merkle tree with zero donations');
  }
  
  // Compute leaf hashes
  const leaves = donations.map(donation => {
    const hash = computeLeafHash(donation);
    return Buffer.from(hash, 'hex');
  });
  
  // Build tree with SHA-256
  // sortPairs: true ensures consistent tree structure
  // We pass a function that returns the hash directly since we already hashed the leaves
  const hashFunction = (data: Buffer) => {
    return crypto.createHash('sha256').update(data).digest();
  };
  
  const tree = new MerkleTree(leaves, hashFunction, {
    sortPairs: true,
    hashLeaves: false, // We already hashed the leaves
  });
  
  const root = tree.getRoot().toString('hex');
  console.log(`✅ Merkle tree built successfully!`);
  console.log(`   Root: ${root}`);
  console.log(`   Height: ${Math.ceil(Math.log2(donations.length)) + 1}`);
  
  return tree;
}

/**
 * Generate a Merkle proof for a specific donation in the tree.
 * The proof allows anyone to verify the donation was included in the batch.
 * 
 * @param tree - MerkleTree instance
 * @param leafHash - Hash of the donation leaf (hex string)
 * @returns Array of proof objects with position and hash
 */
export function getMerkleProof(tree: MerkleTree, leafHash: string): MerkleProof[] {
  const leaf = Buffer.from(leafHash, 'hex');
  const proof = tree.getProof(leaf);
  
  return proof.map(item => ({
    position: item.position as 'left' | 'right',
    hash: item.data.toString('hex'),
  }));
}

/**
 * Verify that a donation is included in a batch using its Merkle proof.
 * 
 * @param leafHash - Hash of the donation leaf (hex string)
 * @param proof - Array of proof objects
 * @param merkleRoot - Root hash of the batch (hex string)
 * @returns true if proof is valid, false otherwise
 */
export function verifyMerkleProof(
  leafHash: string,
  proof: MerkleProof[],
  merkleRoot: string
): boolean {
  console.log(`🔍 Verifying proof for leaf ${leafHash.substring(0, 16)}...`);
  
  // Convert to buffers for merkletreejs
  const leaf = Buffer.from(leafHash, 'hex');
  const root = Buffer.from(merkleRoot, 'hex');
  
  const proofBuffers = proof.map(item => ({
    position: item.position,
    data: Buffer.from(item.hash, 'hex'),
  }));
  
  const hashFunction = (data: Buffer) => {
    return crypto.createHash('sha256').update(data).digest();
  };
  
  // IMPORTANT: Must use same options as when building the tree
  const isValid = MerkleTree.verify(
    proofBuffers,
    leaf,
    root,
    hashFunction,
    {
      sortPairs: true, // Same as when building tree
    }
  );
  
  console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  return isValid;
}

/**
 * Calculate the height of a Merkle tree based on number of leaves.
 * Height = ceil(log2(n)) + 1
 */
export function calculateTreeHeight(leafCount: number): number {
  if (leafCount === 0) return 0;
  if (leafCount === 1) return 1;
  return Math.ceil(Math.log2(leafCount)) + 1;
}

/**
 * Get all leaf hashes from a Merkle tree.
 * Useful for debugging and verification.
 */
export function getLeafHashes(tree: MerkleTree): string[] {
  return tree.getLeaves().map(leaf => leaf.toString('hex'));
}

/**
 * Get the Merkle root as a hex string.
 */
export function getMerkleRoot(tree: MerkleTree): string {
  return tree.getRoot().toString('hex');
}

/**
 * Pretty print a Merkle tree for debugging.
 */
export function printMerkleTree(tree: MerkleTree): void {
  console.log('🌳 Merkle Tree Structure:');
  console.log(tree.toString());
}

