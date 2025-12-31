"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Droplets, Calendar, CheckCircle, Clock, User,
  Filter, Download, TrendingUp, Package, AlertTriangle, Plus, XCircle
} from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import RefillLogForm from '@/components/RefillLogForm';

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

interface Refill {
  id: string;
  feeder_id: string;
  refilled_by: string;
  refill_date: string;
  food_quantity_kg: number;
  food_type: string;
  verified: boolean;
  verified_at: string | null;
  feeder_condition: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  feeders: {
    location_name: string;
    pincode: string;
    area_name: string | null;
  };
  volunteers: {
    name: string;
    email: string | null;
  };
}

type VerifiedFilter = 'all' | 'verified' | 'pending';

export default function RefillsPage() {
  const [refills, setRefills] = useState<Refill[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRefill, setSelectedRefill] = useState<Refill | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { user } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (user && user.email !== SUPER_ADMIN_EMAIL) {
      router.push('/app');
      return;
    }
    if (user) {
      fetchRefills();
    }
  }, [user, router]);

  const fetchRefills = async () => {
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      const { data, error } = await supabase
        .from('feeder_refills')
        .select(`
          *,
          feeders (
            id,
            location_name,
            pincode,
            area_name
          ),
          volunteers (
            id,
            name,
            email
          )
        `)
        .order('refill_date', { ascending: false });

      if (error) throw error;
      setRefills((data || []) as Refill[]);
    } catch (error) {
      console.error('Error fetching refills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (refillId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/refills/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refillId })
      });

      if (!response.ok) throw new Error('Failed to verify refill');

      await fetchRefills();
    } catch (error) {
      console.error('Error verifying refill:', error);
      alert('Failed to verify refill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefill) {
      return;
    }

    setActionLoading(true);
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      // Log rejection for audit trail
      console.log(`Refill ${selectedRefill.id} rejected by admin. Reason: ${rejectionReason.trim() || 'No reason provided'}`);

      // Delete the refill (rejected refills are removed)
      const { error } = await supabase
        .from('feeder_refills')
        .delete()
        .eq('id', selectedRefill.id);

      if (error) throw new Error('Failed to reject refill');

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedRefill(null);
      await fetchRefills();
    } catch (error) {
      console.error('Error rejecting refill:', error);
      alert('Failed to reject refill');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRefills = refills.filter(refill => {
    if (verifiedFilter === 'all') return true;
    if (verifiedFilter === 'verified') return refill.verified === true;
    if (verifiedFilter === 'pending') return refill.verified === false;
    return true;
  });

  const stats = {
    total: refills.length,
    verified: refills.filter(r => r.verified).length,
    pending: refills.filter(r => !r.verified).length,
    totalFood: refills.filter(r => r.verified).reduce((sum, r) => sum + Number(r.food_quantity_kg), 0),
    last7days: refills.filter(r => {
      const refillDate = new Date(r.refill_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return refillDate >= weekAgo;
    }).length,
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Feeder Location', 'Area', 'Volunteer', 'Quantity (kg)', 'Food Type', 'Condition', 'Verified', 'Notes'];
    const rows = refills.map(r => [
      new Date(r.refill_date).toLocaleString('en-IN'),
      r.feeders.location_name,
      r.feeders.area_name || r.feeders.pincode,
      r.volunteers.name,
      r.food_quantity_kg.toString(),
      r.food_type,
      r.feeder_condition,
      r.verified ? 'Yes' : 'No',
      r.notes || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refills_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user?.email !== SUPER_ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-8 h-8 text-primary-600" />
            Refill Logs
          </h1>
          <p className="text-gray-600 mt-1">
            Verify and track all feeder refill activities
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogDialog(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Refill
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Refills</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Droplets className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setVerifiedFilter('verified')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Verified</p>
                <p className="text-3xl font-bold text-green-900">{stats.verified}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setVerifiedFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 opacity-50" />
            </div>
            {stats.pending > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-700">
                <AlertTriangle className="w-3 h-3" />
                Needs verification
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Food</p>
                <p className="text-3xl font-bold text-purple-900">{stats.totalFood.toFixed(1)}</p>
                <p className="text-xs text-purple-600">kg distributed</p>
              </div>
              <Package className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Last 7 Days</p>
                <p className="text-3xl font-bold text-indigo-900">{stats.last7days}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-indigo-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">Filter by Verification Status</CardTitle>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'verified'] as VerifiedFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setVerifiedFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${verifiedFilter === filter
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== 'all' && (
                    <span className="ml-1 text-xs opacity-75">
                      ({filter === 'pending' ? stats.pending : stats.verified})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Refills List */}
      <div className="grid gap-4">
        {filteredRefills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Droplets className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No refill logs found with the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRefills.map((refill, index) => (
            <motion.div
              key={refill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:shadow-lg transition-shadow ${refill.verified ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500'
                }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Refill Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {refill.feeders.location_name}
                          </h3>
                          <p className="text-sm text-gray-600">{refill.feeders.area_name || refill.feeders.pincode}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${refill.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {refill.verified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{refill.volunteers.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(refill.refill_date).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary-600" />
                          <span className="font-semibold">{refill.food_quantity_kg} kg - {refill.food_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${refill.feeder_condition === 'good' ? 'text-green-600' :
                            refill.feeder_condition === 'needs_cleaning' ? 'text-yellow-600' :
                              'text-red-600'
                            }`} />
                          <span className={
                            refill.feeder_condition === 'good' ? 'text-green-600' :
                              refill.feeder_condition === 'needs_cleaning' ? 'text-yellow-600' :
                                'text-red-600'
                          }>
                            {refill.feeder_condition.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        {refill.verified_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs">Verified: {new Date(refill.verified_at).toLocaleDateString('en-IN')}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {refill.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700">Notes:</p>
                          <p className="text-sm text-gray-600 mt-1">{refill.notes}</p>
                        </div>
                      )}

                      {/* Photo */}
                      {refill.photo_url && (
                        <div className="flex items-center gap-2 text-xs text-primary-600">
                          <CheckCircle className="w-3 h-3" />
                          <a href={refill.photo_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            View photo proof
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!refill.verified && (
                      <div className="flex gap-2 lg:flex-col">
                        <button
                          onClick={() => handleVerify(refill.id)}
                          disabled={actionLoading}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRefill(refill);
                            setShowRejectDialog(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Log Refill Dialog (Admin Quick Action) */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Refill (Admin)</DialogTitle>
          </DialogHeader>
          <RefillLogForm
            adminMode={true}
            onSuccess={() => {
              setShowLogDialog(false);
              fetchRefills(); // Refresh list
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reject Refill Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Refill Log</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to reject this refill log? This will permanently delete it.
                {selectedRefill && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium text-gray-900">
                      {selectedRefill.feeders.location_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {selectedRefill.food_quantity_kg} kg by {selectedRefill.volunteers.name}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for rejection (optional):
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Suspicious quantity, duplicate entry, invalid photo, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Rejecting...' : 'Reject & Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

