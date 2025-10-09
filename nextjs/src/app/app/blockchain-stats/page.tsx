/**
 * Blockchain Statistics Dashboard
 * 
 * Comprehensive view of Solana blockchain integration:
 * - Wallet balance and health
 * - Transaction statistics
 * - Cost analysis and projections
 * - Recent transactions
 * 
 * Access: Super admin only
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Activity,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Package,
} from 'lucide-react';

interface BlockchainStats {
  wallet: {
    publicKey: string;
    balance: number;
    balanceUsd: number;
    ready: boolean;
    network: string;
  };
  statistics: {
    totalBatchesAnchored: number;
    totalDonationsAnchored: number;
    totalAmountAnchored: number;
    totalSolSpent: number;
    averageCostPerBatch: number;
    firstAnchor: string | null;
    lastAnchor: string | null;
  };
  transactions: {
    recent: Array<{
      batchId: string;
      signature: string;
      slot: number;
      blockTime: string | null;
      donationCount: number;
      amount: number;
      fee: number;
      success: boolean;
    }>;
    totalFees: number;
    avgFeePerTx: number;
  };
  projections: {
    next100Batches: { batches: number; estimatedSol: number; estimatedUsd: number };
    yearly1000Batches: { batches: number; estimatedSol: number; estimatedUsd: number };
    monthly: { batches: number; estimatedSol: number; estimatedUsd: number };
  };
  networkHealth: {
    network: string;
    rpcUrl: string;
    connected: boolean;
    avgConfirmationTime: string;
  };
}

export default function BlockchainStatsPage() {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/blockchain/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching blockchain stats:', err);
      setError('Failed to fetch blockchain statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getExplorerUrl = (signature: string) => {
    const network = stats?.wallet.network || 'devnet';
    return `https://solscan.io/tx/${signature}${network !== 'mainnet-beta' ? `?cluster=${network}` : ''}`;
  };

  const getAddressUrl = (address: string) => {
    const network = stats?.wallet.network || 'devnet';
    return `https://solscan.io/account/${address}${network !== 'mainnet-beta' ? `?cluster=${network}` : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-red-700">{error || 'Failed to load stats'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Blockchain Statistics
            </h1>
            <p className="text-gray-600 mt-1">
              Solana {stats.wallet.network} • Real-time blockchain metrics
            </p>
          </div>
          <Button
            onClick={fetchStats}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Wallet Info */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Anchor Wallet</div>
                  <div className="font-mono text-sm text-gray-800 mt-1">
                    {stats.wallet.publicKey.substring(0, 8)}...{stats.wallet.publicKey.substring(stats.wallet.publicKey.length - 8)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.wallet.balance.toFixed(4)} SOL
                </div>
                <div className="text-sm text-gray-600">
                  ≈ ${stats.wallet.balanceUsd.toFixed(2)} USD
                </div>
              </div>
              <a
                href={getAddressUrl(stats.wallet.publicKey)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </a>
            </div>
            
            {stats.wallet.ready ? (
              <div className="mt-4 flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Wallet Ready</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Wallet Not Ready</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Batches Anchored */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Package className="w-8 h-8 text-green-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.statistics.totalBatchesAnchored}
                    </div>
                    <div className="text-sm text-gray-600">Batches Anchored</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Donations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.statistics.totalDonationsAnchored}
                    </div>
                    <div className="text-sm text-gray-600">Donations Secured</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Amount */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{stats.statistics.totalAmountAnchored.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Amount Secured</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total SOL Spent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Zap className="w-8 h-8 text-orange-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.statistics.totalSolSpent.toFixed(6)} SOL
                    </div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Cost Projections */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Cost Projections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Next 100 Batches</div>
                <div className="text-lg font-semibold text-blue-600">
                  {stats.projections.next100Batches.estimatedSol.toFixed(6)} SOL
                </div>
                <div className="text-xs text-gray-500">
                  ≈ ${stats.projections.next100Batches.estimatedUsd.toFixed(2)}
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Monthly (100 batches)</div>
                <div className="text-lg font-semibold text-purple-600">
                  {stats.projections.monthly.estimatedSol.toFixed(6)} SOL
                </div>
                <div className="text-xs text-gray-500">
                  ≈ ${stats.projections.monthly.estimatedUsd.toFixed(2)}
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Yearly (1000 batches)</div>
                <div className="text-lg font-semibold text-green-600">
                  {stats.projections.yearly1000Batches.estimatedSol.toFixed(6)} SOL
                </div>
                <div className="text-xs text-gray-500">
                  ≈ ${stats.projections.yearly1000Batches.estimatedUsd.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              * Projections based on average cost of {stats.transactions.avgFeePerTx.toFixed(6)} SOL per transaction
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Transactions
            </h2>
            <div className="space-y-3">
              {stats.transactions.recent.map((tx, index) => (
                <motion.div
                  key={tx.signature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm text-gray-800">
                        {tx.signature.substring(0, 16)}...{tx.signature.substring(tx.signature.length - 8)}
                      </div>
                      {tx.success && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {tx.donationCount} donations • ₹{tx.amount.toLocaleString()} • 
                      {tx.blockTime ? new Date(tx.blockTime).toLocaleString() : 'Pending'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-orange-600">
                        {(tx.fee / 1e9).toFixed(6)} SOL
                      </div>
                      <div className="text-xs text-gray-500">Fee</div>
                    </div>
                    <a
                      href={getExplorerUrl(tx.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Network Health */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Network Health
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Network</div>
                <div className="font-semibold text-gray-900 uppercase">{stats.networkHealth.network}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-semibold text-green-600">
                  {stats.networkHealth.connected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">RPC URL</div>
                <div className="font-mono text-xs text-gray-700 truncate">
                  {stats.networkHealth.rpcUrl}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Confirmation</div>
                <div className="font-semibold text-gray-900">
                  {stats.networkHealth.avgConfirmationTime}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

