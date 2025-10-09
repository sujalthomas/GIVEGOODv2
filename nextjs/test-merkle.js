/**
 * Merkle Tree Test Script (JavaScript version)
 * 
 * Simple test to verify the Merkle tree is working
 * Run with: node test-merkle.js
 */

const crypto = require('crypto');
const { MerkleTree } = require('merkletreejs');

// Mock donation data
function createMockDonation(index) {
  return {
    id: `donation-${index}-${Date.now()}`,
    amount_inr: (index + 1) * 100,
    currency: 'INR',
    payment_id: `pay_test_${index}`,
    upi_reference: index % 2 === 0 ? `UPI${index}` : null,
    created_at: new Date(Date.now() + index * 1000).toISOString(),
    payment_method: index % 2 === 0 ? 'upi' : 'card',
    donor_name: index % 3 === 0 ? null : `Donor ${index}`,
    anonymous: index % 3 === 0,
  };
}

// Serialize donation
function serializeDonation(donation) {
  const parts = [
    donation.id,
    donation.amount_inr.toFixed(2),
    donation.currency,
    donation.payment_id,
    donation.upi_reference || 'NULL',
    donation.created_at,
    donation.payment_method,
    donation.donor_name || 'ANONYMOUS',
    donation.anonymous ? 'true' : 'false',
  ];
  return parts.join('|');
}

// Compute leaf hash
function computeLeafHash(donation) {
  const serialized = serializeDonation(donation);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

// Build Merkle tree
function buildMerkleTree(donations) {
  const leaves = donations.map(d => {
    const hash = computeLeafHash(d);
    return Buffer.from(hash, 'hex');
  });
  
  const hashFunction = (data) => {
    return crypto.createHash('sha256').update(data).digest();
  };
  
  return new MerkleTree(leaves, hashFunction, {
    sortPairs: true,
    hashLeaves: false,
  });
}

// Test function
async function testMerkleTree(donationCount) {
  console.log(`\n🧪 Testing with ${donationCount} donation(s)...`);
  
  try {
    // Create mock donations
    const donations = Array.from({ length: donationCount }, (_, i) => 
      createMockDonation(i)
    );
    
    // Build tree
    console.log('  🌳 Building Merkle tree...');
    const tree = buildMerkleTree(donations);
    const root = tree.getRoot().toString('hex');
    const height = Math.ceil(Math.log2(donationCount)) + 1;
    
    console.log(`  ✅ Root: ${root.substring(0, 16)}...${root.substring(root.length - 8)}`);
    console.log(`  ✅ Height: ${height}`);
    
    // Test proof generation and verification for first donation
    const leafHash = computeLeafHash(donations[0]);
    const leaf = Buffer.from(leafHash, 'hex');
    const proof = tree.getProof(leaf);
    
    console.log(`  🔐 Generated proof with ${proof.length} step(s)`);
    
    // Verify proof
    const hashFunction = (data) => {
      return crypto.createHash('sha256').update(data).digest();
    };
    
    const isValid = MerkleTree.verify(
      proof,
      leaf,
      tree.getRoot(),
      hashFunction,
      { sortPairs: true }
    );
    
    if (isValid) {
      console.log(`  ✅ Proof verification: PASSED`);
    } else {
      console.log(`  ❌ Proof verification: FAILED`);
      return false;
    }
    
    // Test tampered proof
    const tamperedLeaf = Buffer.from('0'.repeat(64), 'hex');
    const tamperedValid = MerkleTree.verify(
      proof,
      tamperedLeaf,
      tree.getRoot(),
      hashFunction,
      { sortPairs: true }
    );
    
    if (!tamperedValid) {
      console.log(`  ✅ Tamper detection: PASSED (rejected invalid leaf)`);
    } else {
      console.log(`  ❌ Tamper detection: FAILED (accepted invalid leaf)`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🎯 === MERKLE TREE TEST SUITE ===');
  
  const testCases = [1, 2, 3, 5, 10, 50, 100];
  const results = [];
  
  for (const count of testCases) {
    const success = await testMerkleTree(count);
    results.push(success);
  }
  
  const allPassed = results.every(r => r);
  
  console.log('\n📊 === TEST RESULTS ===');
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${results.filter(r => r).length}`);
  console.log(`Failed: ${results.filter(r => !r).length}`);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
  } else {
    console.log('\n💥 SOME TESTS FAILED!\n');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests();

