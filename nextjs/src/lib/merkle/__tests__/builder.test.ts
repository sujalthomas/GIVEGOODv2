/**
 * Unit Tests for Merkle Tree Builder
 * 
 * Run with: npm test (if jest is configured)
 * Or run manually with: ts-node -r tsconfig-paths/register src/lib/merkle/__tests__/builder.test.ts
 */

import {
  serializeDonation,
  computeLeafHash,
  buildMerkleTree,
  getMerkleProof,
  getMerkleRoot,
  verifyMerkleProof,
  calculateTreeHeight,
} from '../builder';
import type { DonationLeaf } from '../types';

// Test data
const mockDonation1: DonationLeaf = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  amount_inr: 1000.00,
  currency: 'INR',
  payment_id: 'pay_test_001',
  upi_reference: 'UPI12345678',
  created_at: '2025-02-08T10:00:00.000Z',
  payment_method: 'upi',
  donor_name: 'Test Donor',
  anonymous: false,
};

const mockDonation2: DonationLeaf = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  amount_inr: 2000.00,
  currency: 'INR',
  payment_id: 'pay_test_002',
  upi_reference: null,
  created_at: '2025-02-08T11:00:00.000Z',
  payment_method: 'card',
  donor_name: null,
  anonymous: true,
};

const mockDonation3: DonationLeaf = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  amount_inr: 3000.00,
  currency: 'INR',
  payment_id: 'pay_test_003',
  upi_reference: 'UPI87654321',
  created_at: '2025-02-08T12:00:00.000Z',
  payment_method: 'upi',
  donor_name: 'Another Donor',
  anonymous: false,
};

// Test utilities
function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`❌ ${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
  console.log(`✅ ${message}`);
}

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
  console.log(`✅ ${message}`);
}

// Test Suite
async function runTests() {
  console.log('\n🧪 === MERKLE TREE UNIT TESTS ===\n');

  try {
    // TEST 1: Serialization
    console.log('📋 Test 1: Donation Serialization');
    const serialized1 = serializeDonation(mockDonation1);
    assertTrue(
      serialized1.includes('550e8400-e29b-41d4-a716-446655440000'),
      'Serialization includes donation ID'
    );
    assertTrue(
      serialized1.includes('1000.00'),
      'Serialization includes amount with 2 decimals'
    );
    assertTrue(
      serialized1.includes('INR'),
      'Serialization includes currency'
    );
    assertTrue(
      serialized1.includes('pay_test_001'),
      'Serialization includes payment ID'
    );

    const serialized2 = serializeDonation(mockDonation2);
    assertTrue(
      serialized2.includes('NULL'),
      'Serialization handles null UPI reference'
    );
    assertTrue(
      serialized2.includes('ANONYMOUS'),
      'Serialization handles null donor name'
    );

    // TEST 2: Leaf Hashing
    console.log('\n📋 Test 2: Leaf Hash Generation');
    const hash1 = computeLeafHash(mockDonation1);
    assertEqual(hash1.length, 64, 'SHA-256 hash is 64 characters (hex)');
    
    const hash2 = computeLeafHash(mockDonation1);
    assertEqual(hash1, hash2, 'Same donation produces same hash (deterministic)');

    const hash3 = computeLeafHash(mockDonation2);
    assertTrue(hash1 !== hash3, 'Different donations produce different hashes');

    // TEST 3: Merkle Tree Building (1 donation)
    console.log('\n📋 Test 3: Build Merkle Tree (1 donation)');
    const tree1 = buildMerkleTree([mockDonation1]);
    const root1 = getMerkleRoot(tree1);
    assertEqual(root1.length, 64, 'Merkle root is 64 characters (hex)');
    assertEqual(calculateTreeHeight(1), 1, 'Tree height for 1 leaf is 1');

    // TEST 4: Merkle Tree Building (3 donations)
    console.log('\n📋 Test 4: Build Merkle Tree (3 donations)');
    const tree3 = buildMerkleTree([mockDonation1, mockDonation2, mockDonation3]);
    const root3 = getMerkleRoot(tree3);
    assertEqual(root3.length, 64, 'Merkle root is 64 characters (hex)');
    assertEqual(calculateTreeHeight(3), 3, 'Tree height for 3 leaves is 3');

    // TEST 5: Proof Generation
    console.log('\n📋 Test 5: Merkle Proof Generation');
    const leafHash1 = computeLeafHash(mockDonation1);
    const proof1 = getMerkleProof(tree3, leafHash1);
    assertTrue(proof1.length > 0, 'Proof is generated');
    assertTrue(
      proof1.every(p => p.hash.length === 64),
      'All proof hashes are 64 characters'
    );
    assertTrue(
      proof1.every(p => p.position === 'left' || p.position === 'right'),
      'All proof positions are left or right'
    );

    // TEST 6: Proof Verification (Valid)
    console.log('\n📋 Test 6: Merkle Proof Verification (Valid)');
    const isValid1 = verifyMerkleProof(leafHash1, proof1, root3);
    assertTrue(isValid1, 'Valid proof passes verification');

    // TEST 7: Proof Verification (Invalid - wrong root)
    console.log('\n📋 Test 7: Merkle Proof Verification (Invalid root)');
    const fakeRoot = '0'.repeat(64);
    const isValid2 = verifyMerkleProof(leafHash1, proof1, fakeRoot);
    assertTrue(!isValid2, 'Invalid root fails verification');

    // TEST 8: Proof Verification (Invalid - tampered leaf)
    console.log('\n📋 Test 8: Merkle Proof Verification (Tampered leaf)');
    const tamperedLeaf = '1'.repeat(64);
    const isValid3 = verifyMerkleProof(tamperedLeaf, proof1, root3);
    assertTrue(!isValid3, 'Tampered leaf fails verification');

    // TEST 9: Multiple Leaves Verification
    console.log('\n📋 Test 9: Verify All Leaves in Tree');
    const leafHash2 = computeLeafHash(mockDonation2);
    const leafHash3 = computeLeafHash(mockDonation3);
    const proof2 = getMerkleProof(tree3, leafHash2);
    const proof3 = getMerkleProof(tree3, leafHash3);

    assertTrue(
      verifyMerkleProof(leafHash1, proof1, root3),
      'Leaf 1 verifies correctly'
    );
    assertTrue(
      verifyMerkleProof(leafHash2, proof2, root3),
      'Leaf 2 verifies correctly'
    );
    assertTrue(
      verifyMerkleProof(leafHash3, proof3, root3),
      'Leaf 3 verifies correctly'
    );

    // TEST 10: Tree Heights
    console.log('\n📋 Test 10: Tree Height Calculations');
    assertEqual(calculateTreeHeight(1), 1, 'Height for 1 leaf = 1');
    assertEqual(calculateTreeHeight(2), 2, 'Height for 2 leaves = 2');
    assertEqual(calculateTreeHeight(3), 3, 'Height for 3 leaves = 3');
    assertEqual(calculateTreeHeight(4), 3, 'Height for 4 leaves = 3');
    assertEqual(calculateTreeHeight(5), 4, 'Height for 5 leaves = 4');
    assertEqual(calculateTreeHeight(100), 8, 'Height for 100 leaves = 8');
    assertEqual(calculateTreeHeight(1000), 11, 'Height for 1000 leaves = 11');

    // TEST 11: Determinism (same input = same output)
    console.log('\n📋 Test 11: Determinism Check');
    const tree3_again = buildMerkleTree([mockDonation1, mockDonation2, mockDonation3]);
    const root3_again = getMerkleRoot(tree3_again);
    assertEqual(
      root3,
      root3_again,
      'Same donations produce same merkle root'
    );

    // TEST 12: Large Tree (100 donations)
    console.log('\n📋 Test 12: Large Tree (100 donations)');
    const largeDonations: DonationLeaf[] = Array.from({ length: 100 }, (_, i) => ({
      id: `donation-${i}`,
      amount_inr: (i + 1) * 100,
      currency: 'INR',
      payment_id: `pay_${i}`,
      upi_reference: `UPI${i}`,
      created_at: new Date(Date.now() + i * 1000).toISOString(),
      payment_method: 'upi',
      donor_name: `Donor ${i}`,
      anonymous: false,
    }));

    const largeTree = buildMerkleTree(largeDonations);
    const largeRoot = getMerkleRoot(largeTree);
    assertEqual(largeRoot.length, 64, 'Large tree generates valid root');

    // Verify a random leaf in large tree
    const randomLeafHash = computeLeafHash(largeDonations[50]);
    const randomProof = getMerkleProof(largeTree, randomLeafHash);
    assertTrue(
      verifyMerkleProof(randomLeafHash, randomProof, largeRoot),
      'Random leaf verifies in large tree'
    );

    // All tests passed!
    console.log('\n🎉 === ALL TESTS PASSED! ===\n');
    return true;

  } catch (error) {
    console.error('\n💥 === TEST FAILED ===\n');
    console.error(error);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTests };

