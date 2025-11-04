"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Map, Users, Home, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useMapData } from '@/hooks/useMapData';
import TopAreasPanel from '@/components/TopAreasPanel';
import Link from 'next/link';

// Dynamically import map to avoid SSR issues
const VolunteerFeederMap = dynamic(
  () => import('@/components/VolunteerFeederMap'),
  { ssr: false, loading: () => <div className="w-full h-[600px] bg-gray-100 rounded-2xl animate-pulse"></div> }
);

export default function PublicVolunteerMapPage() {
  const { stats } = useMapData();
  const [showCoverageZones, setShowCoverageZones] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Map className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Our Volunteer Network
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Real-time visualization of our growing community across Bangalore
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg"
          >
            <Users className="w-10 h-10 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.volunteers}</p>
            <p className="text-sm opacity-90">Volunteers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg"
          >
            <Home className="w-10 h-10 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.feeders}</p>
            <p className="text-sm opacity-90">Feeders Built</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg"
          >
            <Map className="w-10 h-10 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.areas}</p>
            <p className="text-sm opacity-90">Areas Covered</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg"
          >
            <TrendingUp className="w-10 h-10 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.coverage}%</p>
            <p className="text-sm opacity-90">Avg Coverage</p>
          </motion.div>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 space-y-4">
            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Visualization Controls</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCoverageZones(!showCoverageZones)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    showCoverageZones
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showCoverageZones ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Coverage Zones
                </button>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    showHeatmap
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Heat Map
                </button>
              </div>
            </div>

            {/* Map Component */}
            <VolunteerFeederMap
              showCoverageZones={showCoverageZones}
              showHeatmap={showHeatmap}
              adminMode={false}
            />

            {/* Legend */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Volunteers:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <span className="text-sm text-gray-600">Builders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                    <span className="text-sm text-gray-600">Refillers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white"></div>
                    <span className="text-sm text-gray-600">Ambassadors</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Feeders:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500 border-2 border-white"></div>
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-yellow-500 border-2 border-white"></div>
                    <span className="text-sm text-gray-600">Needs Attention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500 border-2 border-white"></div>
                    <span className="text-sm text-gray-600">Overdue Refill</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TopAreasPanel />
            
            {/* CTA Card */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-2">Join Our Network</h3>
              <p className="text-sm text-gray-600 mb-4">
                Be part of the movement. Sign up as a volunteer today!
              </p>
              <Link
                href="/#join"
                className="block text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Become a Volunteer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

