"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Home } from 'lucide-react';
import { getTopAreas, AreaMetrics } from '@/lib/maps/area-analytics';

export default function TopAreasPanel() {
  const [topAreas, setTopAreas] = useState<AreaMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopAreas();
  }, []);

  const loadTopAreas = async () => {
    try {
      const areas = await getTopAreas(6);
      setTopAreas(areas);
      setError(null);
    } catch (error) {
      console.error('Error loading top areas:', error);
      setError('Failed to load top areas');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 border border-white/20">
        <div className="text-center py-4">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              loadTopAreas();
            }}
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 border border-white/20">
        {/* Header Skeleton */}
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <div className="w-5 h-5 bg-gradient-to-br from-primary-200 to-primary-300 rounded animate-pulse"></div>
          <div className="h-5 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
        </div>

        {/* Area Cards Skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full animate-pulse"></div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                <div className="h-3 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-h-[500px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 border-b pb-2">
        <TrendingUp className="w-5 h-5 text-primary-600" />
        <h3 className="font-bold text-gray-900">Top Areas</h3>
      </div>

      <div className="space-y-2">
        {topAreas.map((area, index) => (
          <motion.div
            key={area.pincode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-600">{index + 1}</span>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">{area.areaName}</h4>
                  <p className="text-xs text-gray-500 font-mono">{area.pincode}</p>
                </div>
              </div>
              <span
                className={`text-lg font-bold ${area.coveragePercent >= 80 ? 'text-green-600' :
                    area.coveragePercent >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}
              >
                {area.coveragePercent}%
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{area.volunteerCount} vol</span>
              </div>
              <div className="flex items-center gap-1">
                <Home className="w-3 h-3" />
                <span>{area.feederCount} feeders</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${area.healthScore >= 80 ? 'bg-green-500' :
                    area.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                <span className={
                  area.healthScore >= 80 ? 'text-green-600 font-semibold' :
                    area.healthScore >= 60 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'
                }>
                  {area.healthScore}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

