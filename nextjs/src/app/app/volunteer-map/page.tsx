"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Map, Eye, EyeOff, Download } from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useMapData } from '@/hooks/useMapData';
import TopAreasPanel from '@/components/TopAreasPanel';

const VolunteerFeederMap = dynamic(
  () => import('@/components/VolunteerFeederMap'),
  { ssr: false, loading: () => <div className="w-full h-[600px] bg-gray-100 rounded-2xl animate-pulse"></div> }
);

const SUPER_ADMIN_EMAIL = 'sujalt1811@gmail.com';

export default function AdminVolunteerMapPage() {
  const { user } = useGlobal();
  const router = useRouter();
  const { stats } = useMapData();
  
  const [showCoverageZones, setShowCoverageZones] = useState(true);
  const [showConnections, setShowConnections] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (user && user.email !== SUPER_ADMIN_EMAIL) {
      router.push('/app');
    }
  }, [user, router]);

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Map className="w-8 h-8 text-primary-600" />
            Volunteer & Feeder Map
          </h1>
          <p className="text-gray-600 mt-1">Admin view - All volunteers and feeders across Bangalore</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-900">{stats.volunteers}</p>
          <p className="text-sm text-blue-600">Total Volunteers</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-900">{stats.feeders}</p>
          <p className="text-sm text-green-600">Total Feeders</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-900">{stats.areas}</p>
          <p className="text-sm text-purple-600">Areas Covered</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-900">{stats.coverage}%</p>
          <p className="text-sm text-red-600">Coverage</p>
        </div>
      </div>

      {/* Map & Sidebar */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowCoverageZones(!showCoverageZones)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  showCoverageZones ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {showCoverageZones ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Coverage Zones
              </button>
              <button
                onClick={() => setShowConnections(!showConnections)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  showConnections ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {showConnections ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Connections
              </button>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  showHeatmap ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Heat Map
              </button>
            </div>
          </div>

          <VolunteerFeederMap
            showCoverageZones={showCoverageZones}
            showConnections={showConnections}
            showHeatmap={showHeatmap}
            adminMode={true}
          />
        </div>

        <div>
          <TopAreasPanel />
        </div>
      </div>
    </div>
  );
}

