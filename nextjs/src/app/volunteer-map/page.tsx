"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, Users, Home, Eye, EyeOff, TrendingUp, Layers, X, 
  Heart, ArrowLeft, Sparkles, Navigation, PawPrint
} from 'lucide-react';
import { useMapData } from '@/hooks/useMapData';
import TopAreasPanel from '@/components/TopAreasPanel';
import Link from 'next/link';

// Dynamically import Mapbox map to avoid SSR issues
const MapboxVolunteerMap = dynamic(
  () => import('@/components/MapboxVolunteerMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interactive map...</p>
        </div>
      </div>
    )
  }
);

export default function PublicVolunteerMapPage() {
  const { stats, loading } = useMapData();
  const [showCoverageZones, setShowCoverageZones] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showTopAreas, setShowTopAreas] = useState(true);
  const [showCTA, setShowCTA] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Minimal Top Bar with Glassmorphism */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/10"
      >
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-primary-600/20 group-hover:bg-primary-600/30 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="hidden md:block font-medium">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-primary-400" />
                <div>
                  <h1 className="text-sm md:text-base font-bold text-white">
                    Bangalore Volunteer Network
                  </h1>
                  <p className="text-xs text-gray-300 hidden md:block">
                    Real-time community visualization
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Pills - Compact */}
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
              >
                <Users className="w-4 h-4 text-blue-300" />
                <span className="text-white font-bold text-sm">{stats.volunteers}</span>
                <span className="text-gray-300 text-xs">volunteers</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
              >
                <Home className="w-4 h-4 text-green-300" />
                <span className="text-white font-bold text-sm">{stats.feeders}</span>
                <span className="text-gray-300 text-xs">feeders</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
              >
                <Map className="w-4 h-4 text-purple-300" />
                <span className="text-white font-bold text-sm">{stats.areas}</span>
                <span className="text-gray-300 text-xs">areas</span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Map Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Full-screen Map */}
        <div className="absolute inset-0">
          <MapboxVolunteerMap
            showCoverageZones={showCoverageZones}
            showHeatmap={showHeatmap}
            showConnections={showConnections}
            show3DBuildings={show3DBuildings}
            adminMode={false}
          />
        </div>

        {/* Floating Controls - Left Side */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-4 top-4 z-40"
            >
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 w-72">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Map Layers</h3>
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
                    { 
                      label: 'Coverage Zones', 
                      value: showCoverageZones, 
                      onChange: setShowCoverageZones,
                      icon: Navigation,
                      color: 'from-green-500 to-emerald-600'
                    },
                    { 
                      label: 'Heat Map', 
                      value: showHeatmap, 
                      onChange: setShowHeatmap,
                      icon: TrendingUp,
                      color: 'from-orange-500 to-red-600'
                    },
                    { 
                      label: 'Connections', 
                      value: showConnections, 
                      onChange: setShowConnections,
                      icon: Users,
                      color: 'from-blue-500 to-indigo-600'
                    },
                    { 
                      label: '3D Buildings', 
                      value: show3DBuildings, 
                      onChange: setShow3DBuildings,
                      icon: Home,
                      color: 'from-purple-500 to-pink-600'
                    }
                  ].map((control, idx) => {
                    const Icon = control.icon;
                    return (
                      <motion.button
                        key={control.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => control.onChange(!control.value)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-xl transition-all
                          ${control.value 
                            ? `bg-gradient-to-r ${control.color} text-white shadow-lg scale-[1.02]` 
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{control.label}</span>
                        </div>
                        <div className={`
                          w-10 h-5 rounded-full transition-colors relative
                          ${control.value ? 'bg-white/30' : 'bg-gray-300'}
                        `}>
                          <div className={`
                            absolute top-0.5 w-4 h-4 rounded-full transition-all
                            ${control.value ? 'left-5 bg-white' : 'left-0.5 bg-white'}
                          `} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
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
          >
            <Layers className="w-5 h-5 text-primary-600" />
          </motion.button>
        )}

        {/* Floating Sidebar - Right Side */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute right-4 top-4 bottom-4 z-40 w-80 md:w-96 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {/* Top Areas Panel with enhanced styling */}
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

                {/* Enhanced CTA Card */}
                <AnimatePresence>
                  {showCTA && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl shadow-2xl p-6 text-white border border-primary-400/20 relative"
                    >
                      <button
                        onClick={() => setShowCTA(false)}
                        className="absolute top-3 right-3 z-10 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Heart className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Join the Movement</h3>
                          <div className="flex items-center gap-1 text-xs text-primary-100">
                            <Sparkles className="w-3 h-3" />
                            <span>Every hand counts!</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-primary-50 mb-4 leading-relaxed">
                        Be part of Bangalore's growing community of changemakers. Help us feed stray animals across the city!
                      </p>
                      <Link
                        href="/#join"
                        className="block text-center bg-white text-primary-700 font-semibold px-5 py-3 rounded-xl hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      >
                        Become a Volunteer →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Show hidden cards buttons */}
                {!showTopAreas && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowTopAreas(true)}
                    className="w-full bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-3 text-sm font-medium text-gray-700 hover:bg-white transition-all border border-white/20"
                  >
                    Show Top Areas
                  </motion.button>
                )}
                {!showCTA && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowCTA(true)}
                    className="w-full bg-primary-600/90 backdrop-blur-lg rounded-xl shadow-lg p-3 text-sm font-medium text-black hover:text-white hover:bg-primary-700 transition-all"
                  >
                    Show Join CTA
                  </motion.button>
                )}
              </div>

              {/* Close Entire Sidebar Button - Visible on left edge */}
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
          >
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

