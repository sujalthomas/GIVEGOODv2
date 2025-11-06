"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, MapPin, Calendar, CheckCircle, XCircle, Clock, AlertTriangle,
  Filter, Download, Droplets, Package, Plus, TrendingUp
} from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FeederSubmissionForm from '@/components/FeederSubmissionForm';

const SUPER_ADMIN_EMAIL = 'sujalt1811@gmail.com';

interface Feeder {
  id: string;
  location_name: string;
  pincode: string;
  area_name: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  status: 'pending' | 'active' | 'inactive' | 'removed' | 'needs_repair' | 'rejected';
  capacity_kg: number | null;
  installation_date: string | null;
  photo_url: string | null;
  refill_frequency_days: number;
  last_refilled_at: string | null;
  next_refill_due: string | null;
  feeder_type: string;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

type StatusFilter = 'all' | 'pending' | 'active' | 'inactive' | 'needs_repair';

export default function FeedersPage() {
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [selectedFeeder, setSelectedFeeder] = useState<Feeder | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feederHealth, setFeederHealth] = useState<Record<string, number>>({});
  
  const { user } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (user && user.email !== SUPER_ADMIN_EMAIL) {
      router.push('/app');
      return;
    }
    if (user) {
      fetchFeeders();
    }
  }, [user, router]);

  const fetchFeeders = async () => {
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      const { data, error } = await supabase
        .from('feeders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeeders((data || []) as Feeder[]);

      // Fetch refills for health calculation (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: refills } = await supabase
        .from('feeder_refills')
        .select('feeder_id, refill_date, verified')
        .gte('refill_date', thirtyDaysAgo.toISOString());

      // Calculate health score for each feeder
      const healthScores: Record<string, number> = {};
      (data || [] as Feeder[]).forEach((feeder) => {
        if (feeder.status !== 'active') {
          healthScores[feeder.id] = 0;
          return;
        }

        const feederRefills = (refills || []).filter((r: { feeder_id: string; verified: boolean | null }) => 
          r.feeder_id === feeder.id && r.verified === true
        );

        const idealRefills = Math.ceil(30 / (feeder.refill_frequency_days || 7));
        const actualRefills = feederRefills.length;
        const refillRatio = idealRefills > 0 ? Math.min(actualRefills / idealRefills, 1) : 0;
        const healthScore = Math.round(refillRatio * 100);

        healthScores[feeder.id] = healthScore;
      });

      setFeederHealth(healthScores);
    } catch (error) {
      console.error('Error fetching feeders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (feederId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/feeders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feederId,
          status: 'active'
        })
      });

      if (!response.ok) throw new Error('Failed to approve feeder');
      
      await fetchFeeders();
    } catch (error) {
      console.error('Error approving feeder:', error);
      alert('Failed to approve feeder');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedFeeder || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/feeders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feederId: selectedFeeder.id,
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to reject feeder');
      
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedFeeder(null);
      await fetchFeeders();
    } catch (error) {
      console.error('Error rejecting feeder:', error);
      alert('Failed to reject feeder');
    } finally {
      setActionLoading(false);
    }
  };

  const isOverdue = (feeder: Feeder) => {
    if (!feeder.next_refill_due) return false;
    return new Date(feeder.next_refill_due) < new Date();
  };

  const filteredFeeders = feeders.filter(feeder => {
    return statusFilter === 'all' || feeder.status === statusFilter;
  });

  const stats = {
    total: feeders.length,
    pending: feeders.filter(f => f.status === 'pending').length,
    active: feeders.filter(f => f.status === 'active').length,
    needsRepair: feeders.filter(f => f.status === 'needs_repair').length,
    overdue: feeders.filter(f => f.status === 'active' && isOverdue(f)).length,
  };

  const exportToCSV = () => {
    const headers = ['Location', 'Area', 'Pincode', 'Status', 'Capacity (kg)', 'Last Refilled', 'Next Due', 'Installed', 'Type'];
    const rows = feeders.map(f => [
      f.location_name,
      f.area_name || f.pincode,
      f.pincode,
      f.status,
      f.capacity_kg?.toString() || 'N/A',
      f.last_refilled_at ? new Date(f.last_refilled_at).toLocaleDateString('en-IN') : 'Never',
      f.next_refill_due ? new Date(f.next_refill_due).toLocaleDateString('en-IN') : 'N/A',
      f.installation_date || 'N/A',
      f.feeder_type
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feeders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
            <Home className="w-8 h-8 text-primary-600" />
            Feeder Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track all pet feeders across Bangalore
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Feeder
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
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Home className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('active')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-900">{stats.active}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('needs_repair')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Needs Repair</p>
                <p className="text-3xl font-bold text-red-900">{stats.needsRepair}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Overdue</p>
                <p className="text-3xl font-bold text-orange-900">{stats.overdue}</p>
              </div>
              <Droplets className="w-12 h-12 text-orange-600 opacity-50" />
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
              <CardTitle className="text-lg">Filter by Status</CardTitle>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'active', 'needs_repair', 'inactive'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'needs_repair' ? 'Needs Repair' : status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-1 text-xs opacity-75">
                      ({status === 'pending' ? stats.pending : status === 'active' ? stats.active : status === 'needs_repair' ? stats.needsRepair : feeders.filter(f => f.status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Feeders List */}
      <div className="grid gap-4">
        {filteredFeeders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No feeders found with the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredFeeders.map((feeder, index) => (
            <motion.div
              key={feeder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:shadow-lg transition-shadow ${
                feeder.status === 'pending' ? 'border-l-4 border-l-yellow-500' :
                feeder.status === 'active' ? 'border-l-4 border-l-green-500' :
                feeder.status === 'needs_repair' ? 'border-l-4 border-l-red-500' :
                'border-l-4 border-l-gray-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Feeder Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          {feeder.location_name}
                          <Home className="w-4 h-4 text-primary-500" />
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          feeder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          feeder.status === 'active' ? 'bg-green-100 text-green-800' :
                          feeder.status === 'needs_repair' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {feeder.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{feeder.area_name || feeder.pincode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-400" />
                          <span className="font-mono font-semibold">{feeder.pincode}</span>
                        </div>
                        {feeder.landmark && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-xs">{feeder.landmark}</span>
                          </div>
                        )}
                        {feeder.capacity_kg && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>{feeder.capacity_kg} kg capacity</span>
                          </div>
                        )}
                        {feeder.installation_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Installed: {new Date(feeder.installation_date).toLocaleDateString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Submitted: {new Date(feeder.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Refill Status & Health */}
                      {feeder.status === 'active' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-xs">
                            {feeder.last_refilled_at ? (
                              <div className="flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-green-600" />
                                <span className="text-gray-600">
                                  Last refilled: {new Date(feeder.last_refilled_at).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-yellow-600" />
                                <span className="text-yellow-600">Never refilled</span>
                              </div>
                            )}
                            {feeder.next_refill_due && (
                              <div className={`flex items-center gap-1 ${isOverdue(feeder) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                <Clock className="w-3 h-3" />
                                <span>
                                  Next due: {new Date(feeder.next_refill_due).toLocaleDateString('en-IN')}
                                  {isOverdue(feeder) && ' (OVERDUE!)'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Health Score */}
                          {feederHealth[feeder.id] !== undefined && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  feederHealth[feeder.id] >= 80 ? 'bg-green-500' :
                                  feederHealth[feeder.id] >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                <span className={`text-sm font-semibold ${
                                  feederHealth[feeder.id] >= 80 ? 'text-green-600' :
                                  feederHealth[feeder.id] >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  Health: {feederHealth[feeder.id]}%
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  (Based on refill frequency)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Type & Notes */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          {feeder.feeder_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {feeder.notes && (
                          <span className="text-xs text-gray-500 italic">
                            Note: {feeder.notes}
                          </span>
                        )}
                      </div>

                      {/* Rejection Reason */}
                      {feeder.status === 'rejected' && feeder.rejection_reason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-semibold text-red-700">Rejection Reason:</p>
                          <p className="text-sm text-red-600 mt-1">{feeder.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {feeder.status === 'pending' && (
                      <div className="flex gap-2 lg:flex-col">
                        <button
                          onClick={() => handleApprove(feeder.id)}
                          disabled={actionLoading}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFeeder(feeder);
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

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Feeder Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting <strong>{selectedFeeder?.location_name}</strong>.
              This will help improve future submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Invalid location, Missing photo, Duplicate feeder, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Rejecting...' : 'Reject Submission'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Feeder Dialog (Admin Quick Action) */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Feeder (Admin)</DialogTitle>
          </DialogHeader>
          <FeederSubmissionForm 
            adminMode={true}
            onSuccess={() => {
              setShowCreateDialog(false);
              fetchFeeders(); // Refresh list
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

