'use client';

/**
 * Anchor Batches Admin Dashboard
 * 
 * This page allows super admins to:
 * - View all Merkle batches
 * - Create new batches from unanchored donations
 * - View batch details and donations
 * - Monitor batch status (pending/anchored)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface Batch {
  id: string;
  created_at: string;
  updated_at: string;
  merkle_root: string;
  tree_height: number;
  leaf_count: number;
  donation_count: number;
  total_amount_inr: number;
  batch_start_time: string;
  batch_end_time: string;
  status: string;
  retry_count: number | null;
  onchain_tx_signature: string | null;
  metadata: Record<string, unknown> | null;
}

interface BatchStats {
  total: number;
  pending: number;
  anchored: number;
}

export default function AnchorBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState<BatchStats>({ total: 0, pending: 0, anchored: 0 });
  const [unanchoredCount, setUnanchoredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/batches/list');
      const data = await response.json();
      
      if (response.ok) {
        setBatches(data.batches);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch batches');
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unanchored donations count
  const fetchUnanchoredCount = async () => {
    try {
      const response = await fetch('/api/batches/create-batch');
      const data = await response.json();
      
      if (response.ok) {
        setUnanchoredCount(data.unanchoredCount || 0);
      }
    } catch (err) {
      console.error('Error fetching unanchored count:', err);
    }
  };

  // Create new batch
  const handleCreateBatch = async () => {
    try {
      setCreating(true);
      setError(null);
      
      const response = await fetch('/api/batches/create-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxBatchSize: 100,
          timeWindowHours: 24,
          minBatchSize: 1,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.batch) {
          alert(`✅ Batch created successfully!\n\nDonations: ${data.batch.donationCount}\nTotal: ₹${data.batch.totalAmount.toLocaleString()}\nMerkle Root: ${data.batch.merkleRoot.substring(0, 16)}...`);
          fetchBatches();
          fetchUnanchoredCount();
        } else {
          alert(data.message || 'No donations to batch');
        }
      } else {
        setError(data.error || 'Failed to create batch');
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Error creating batch:', err);
      setError('Failed to create batch');
      alert('❌ Failed to create batch. Check console for details.');
    } finally {
      setCreating(false);
    }
  };

  // Retry failed batch
  const handleRetryBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to retry this failed batch?')) {
      return;
    }

    try {
      const response = await fetch('/api/batches/retry-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}\n\nRetry Count: ${data.batch.retryCount}/${data.batch.maxRetries}\nBackoff Delay: ${data.batch.backoffDelayMs}ms`);
        fetchBatches();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Error retrying batch:', err);
      alert('❌ Failed to retry batch. Check console for details.');
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchUnanchoredCount();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { 
        icon: Clock, 
        label: 'Pending', 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700',
        border: 'border-yellow-300'
      },
      anchoring: { 
        icon: Clock, 
        label: 'Anchoring', 
        bg: 'bg-blue-100', 
        text: 'text-blue-700',
        border: 'border-blue-300'
      },
      confirmed: { 
        icon: CheckCircle2, 
        label: 'Confirmed', 
        bg: 'bg-green-100', 
        text: 'text-green-700',
        border: 'border-green-300'
      },
      failed: { 
        icon: AlertCircle, 
        label: 'Failed', 
        bg: 'bg-red-100', 
        text: 'text-red-700',
        border: 'border-red-300'
      },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading batches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Package className="w-10 h-10 text-blue-600" />
                Anchor Batches
              </h1>
              <p className="text-gray-600">
                Manage Merkle batches for blockchain transparency
              </p>
            </div>
            
            <Button
              onClick={handleCreateBatch}
              disabled={creating || unanchoredCount === 0}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-6 text-lg"
            >
              {creating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Batch
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border-2 border-blue-200 shadow-lg">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600 font-semibold">Total Batches</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-white border-2 border-yellow-200 shadow-lg">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
                    <div className="text-sm text-gray-600 font-semibold">Pending Anchor</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white border-2 border-green-200 shadow-lg">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.anchored}</div>
                    <div className="text-sm text-gray-600 font-semibold">On Blockchain</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 shadow-lg">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{unanchoredCount}</div>
                    <div className="text-sm text-gray-600 font-semibold">Ready to Batch</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Batches List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white shadow-xl border-2 border-gray-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                All Batches
              </h2>

              {batches.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No batches created yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Create your first batch from unanchored donations
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch, index) => (
                    <motion.div
                      key={batch.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gray-900">
                              Batch #{batch.id.substring(0, 8)}
                            </h3>
                            {getStatusBadge(batch.status)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Donations:</span>
                              <span className="ml-2 font-bold text-gray-900">{batch.donation_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Amount:</span>
                              <span className="ml-2 font-bold text-green-700">₹{batch.total_amount_inr.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tree Height:</span>
                              <span className="ml-2 font-bold text-gray-900">{batch.tree_height}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <span className="ml-2 font-bold text-gray-900">{formatDate(batch.created_at)}</span>
                            </div>
                          </div>

                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Merkle Root:</div>
                            <code className="text-xs font-mono text-blue-600 break-all">
                              {batch.merkle_root ? (
                                <>
                                  {batch.merkle_root.substring(0, 32)}...
                                  {batch.merkle_root.substring(batch.merkle_root.length - 8)}
                                </>
                              ) : (
                                <span className="text-red-600">No merkle root found</span>
                              )}
                            </code>
                          </div>

                          {batch.onchain_tx_signature && (
                            <div className="mt-2 p-3 bg-green-50 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Blockchain Transaction:</div>
                              <a
                                href={`https://explorer.solana.com/tx/${batch.onchain_tx_signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-green-600 hover:text-green-700 underline break-all"
                              >
                                {batch.onchain_tx_signature}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex gap-2">
                          {batch.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryBatch(batch.id)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              title="Retry failed batch"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBatch(selectedBatch === batch.id ? null : batch.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded View */}
                      {selectedBatch === batch.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t-2 border-gray-200"
                        >
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-bold text-gray-700 mb-2">Full Merkle Root:</h4>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <code className="text-xs font-mono text-blue-700 break-all">
                                  {batch.merkle_root || 'No merkle root found'}
                                </code>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-gray-700 mb-2">Batch Metadata:</h4>
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500">Batch ID:</span>
                                    <div className="font-mono text-gray-900 break-all">{batch.id}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Leaf Count:</span>
                                    <div className="font-bold text-gray-900">{batch.leaf_count}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Retry Count:</span>
                                    <div className="font-bold text-gray-900">{batch.retry_count || 0}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Updated:</span>
                                    <div className="font-bold text-gray-900">{formatDate(batch.updated_at)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {batch.metadata && (
                              <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Additional Info:</h4>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                                    {JSON.stringify(batch.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

