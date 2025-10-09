/**
 * Solana Wallet Generator
 * 
 * This script generates a new Solana keypair for anchoring donations.
 * Run with: node generate-wallet.js
 */

const { Keypair } = require('@solana/web3.js');

function generateWallet() {
  console.log('\n🔐 === GENERATING SOLANA WALLET ===\n');
  
  // Generate new keypair
  const keypair = Keypair.generate();
  
  // Get public key (can be shared)
  const publicKey = keypair.publicKey.toBase58();
  
  // Get private key as array (MUST BE KEPT SECRET!)
  const privateKeyArray = Array.from(keypair.secretKey);
  
  // Display results
  console.log('✅ Wallet Generated Successfully!\n');
  console.log('📍 Public Key (share this, use for funding):');
  console.log(`   ${publicKey}\n`);
  console.log('🔒 Private Key (KEEP THIS SECRET!):');
  console.log(`   ${JSON.stringify(privateKeyArray)}\n`);
  console.log('─────────────────────────────────────────────────\n');
  console.log('📋 Add this to your .env.local file:\n');
  console.log('SOLANA_NETWORK=devnet');
  console.log(`SOLANA_ANCHOR_PRIVATE_KEY=${JSON.stringify(privateKeyArray)}\n`);
  console.log('─────────────────────────────────────────────────\n');
  console.log('⚠️  SECURITY WARNINGS:');
  console.log('   • Never commit this to git');
  console.log('   • Never share the private key');
  console.log('   • Store securely in environment variables');
  console.log('   • For production, use Vercel env vars\n');
  console.log('📖 Next Steps:');
  console.log('   1. Copy the private key to .env.local');
  console.log('   2. Fund wallet with devnet SOL: https://faucet.solana.com/');
  console.log('   3. Paste your public key and request airdrop');
  console.log('   4. Test with: curl http://localhost:3000/api/batches/wallet-status\n');
  console.log('🔍 View on Explorer:');
  console.log(`   https://explorer.solana.com/address/${publicKey}?cluster=devnet\n`);
}

// Run the generator
generateWallet();

