"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Eye, EyeOff, Download, Users, Home, TrendingUp, Navigation, Layers,
  AlertCircle, Activity, X
} from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useMapData } from '@/hooks/useMapData';
import TopAreasPanel from '@/components/TopAreasPanel';
import Link from 'next/link';

const MapboxVolunteerMap = dynamic(
  () => import('@/components/MapboxVolunteerMap'),
  { ssr: false }
);

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

export default function AdminVolunteerMapPage() {
  const { user } = useGlobal();
  const router = useRouter();
  const { stats, volunteers, feeders, loading } = useMapData();

  const [showCoverageZones, setShowCoverageZones] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showPendingReviews, setShowPendingReviews] = useState(true);
  const [showTopAreas, setShowTopAreas] = useState(true);
  const [showCoverageAnalysis, setShowCoverageAnalysis] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (user && user.email !== SUPER_ADMIN_EMAIL) {
      router.push('/app');
    }
  }, [user, router]);

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return null;
  }

  const handleExportData = () => {
    const csvData = `Area,Volunteers,Feeders,Coverage\nTotal,${stats.volunteers},${stats.feeders},${stats.coverage}%`;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bangalore-coverage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading coverage map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <MapIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Coverage Map</h1>
            <p className="text-xs text-gray-500">Interactive network visualization</p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">{stats.volunteers}</span>
            <span className="text-xs text-blue-600">volunteers</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
            <Home className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">{stats.feeders}</span>
            <span className="text-xs text-green-600">feeders</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
            <MapIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">{stats.areas}</span>
            <span className="text-xs text-purple-600">areas</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
        {/* Full Map */}
        <div className="absolute inset-0">
          <MapboxVolunteerMap
            volunteers={volunteers}
            feeders={feeders}
            showCoverageZones={showCoverageZones}
            showConnections={showConnections}
            showHeatmap={showHeatmap}
            show3DBuildings={false}
          />
        </div>

        {/* Floating Controls - Left */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-4 top-4 z-40 flex flex-col gap-3"
            >
              {/* Layer Controls */}
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 w-64">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Layers className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Map Layers</h3>
                  </div>
                  <button
                    onClick={() => setShowControls(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Coverage Zones', value: showCoverageZones, onChange: setShowCoverageZones, icon: Navigation },
                    { label: 'Heat Map', value: showHeatmap, onChange: setShowHeatmap, icon: TrendingUp },
                    { label: 'Network Lines', value: showConnections, onChange: setShowConnections, icon: Users },
                    { label: 'Top Areas', value: showTopAreas, onChange: setShowTopAreas, icon: TrendingUp },
                    { label: 'Coverage Analysis', value: showCoverageAnalysis, onChange: setShowCoverageAnalysis, icon: Activity }
                  ].map(control => {
                    const Icon = control.icon;
                    return (
                      <button
                        key={control.label}
                        onClick={() => control.onChange(!control.value)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all
                          ${control.value
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{control.label}</span>
                        </div>
                        {control.value ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pending Reviews - Below Layers */}
              {showPendingReviews && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-2xl p-4 text-white border border-amber-300/20 w-64 relative"
                >
                  <button
                    onClick={() => setShowPendingReviews(false)}
                    className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm">Pending Reviews</h3>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href="/app/volunteers?status=pending"
                      className="block p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Volunteer Approvals</span>
                        <span className="px-2 py-0.5 bg-white/30 rounded-full">Review →</span>
                      </div>
                    </Link>
                    <Link
                      href="/app/feeders?status=pending"
                      className="block p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Feeder Approvals</span>
                        <span className="px-2 py-0.5 bg-white/30 rounded-full">Review →</span>
                      </div>
                    </Link>
                    <Link
                      href="/app/refills?verified=false"
                      className="block p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Refill Verifications</span>
                        <span className="px-2 py-0.5 bg-white/30 rounded-full">Verify →</span>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Controls Button */}
        {!showControls && (
          <motion.button
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            onClick={() => setShowControls(true)}
            className="absolute left-4 top-4 z-40 p-3 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all border border-white/20"
            title="Show layers"
          >
            <Layers className="w-5 h-5 text-primary-600" />
          </motion.button>
        )}

        {/* Toggle Pending Reviews Button */}
        {!showPendingReviews && showControls && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowPendingReviews(true)}
            className="absolute left-4 bottom-4 z-40 p-3 bg-amber-500/95 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all border border-amber-400/20 text-white"
            title="Show pending reviews"
          >
            <AlertCircle className="w-5 h-5" />
          </motion.button>
        )}

        {/* Floating Sidebar - Right */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute right-4 top-4 bottom-4 z-40 w-80 flex flex-col gap-3 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto space-y-3">
                {/* Top Areas Panel - Collapsible */}
                <AnimatePresence>
                  {showTopAreas && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative"
                    >
                      <button
                        onClick={() => setShowTopAreas(false)}
                        className="absolute top-3 right-3 z-10 p-1.5 bg-gray-100/80 hover:bg-gray-200/80 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                      <TopAreasPanel />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Coverage Analysis - Collapsible */}
                <AnimatePresence>
                  {showCoverageAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-4 text-white border border-blue-400/20 relative"
                    >
                      <button
                        onClick={() => setShowCoverageAnalysis(false)}
                        className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">Coverage Analysis</h3>
                          <p className="text-xs text-blue-100">Strategic insights</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                          <p className="text-blue-50 leading-relaxed">
                            <strong className="text-white">{stats.areas}</strong> areas have active coverage.
                            Current avg: <strong className="text-white">{stats.coverage}%</strong>
                          </p>
                        </div>
                        <div className="pt-1 text-blue-100 leading-relaxed">
                          Focus recruitment on uncovered pincodes to reach 100% Bangalore coverage.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close Sidebar Button */}
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute -left-12 top-1/2 -translate-y-1/2 p-3 bg-white/95 backdrop-blur-lg rounded-l-xl shadow-2xl hover:shadow-xl transition-all border border-white/20 border-r-0 hover:scale-110"
                title="Hide sidebar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Sidebar Button */}
        {!showSidebar && (
          <motion.button
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            onClick={() => setShowSidebar(true)}
            className="absolute right-4 top-4 z-40 p-3 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all border border-white/20"
            title="Show sidebar"
          >
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

