"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Home } from 'lucide-react';
import { getTopAreas, AreaMetrics } from '@/lib/maps/area-analytics';

export default function TopAreasPanel() {
  const [topAreas, setTopAreas] = useState<AreaMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopAreas();
  }, []);

  const loadTopAreas = async () => {
    try {
      const areas = await getTopAreas(6);
      setTopAreas(areas);
    } catch (error) {
      console.error('Error loading top areas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
                className={`text-lg font-bold ${
                  area.coveragePercent >= 80 ? 'text-green-600' :
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
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

