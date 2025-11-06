"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Map, Marker, Popup, Layer, Source, type MapRef } from 'react-map-gl/mapbox';
import { motion } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';

interface VolunteerData {
  id: string;
  name: string;
  area: string;
  pincode: string;
  area_name: string | null;
  help_types: string[];
  latitude: number;
  longitude: number;
}

interface FeederData {
  id: string;
  location_name: string;
  pincode: string;
  area_name: string | null;
  latitude: number;
  longitude: number;
  status: string;
  capacity_kg: number | null;
  last_refilled_at: string | null;
  next_refill_due: string | null;
}

interface MapProps {
  volunteers: VolunteerData[];
  feeders: FeederData[];
  showCoverageZones?: boolean;
  showConnections?: boolean;
  showHeatmap?: boolean;
  show3DBuildings?: boolean;
}

// Bangalore center coordinates
const BANGALORE_CENTER = {
  latitude: 12.9716,
  longitude: 77.5946
};

export default function MapboxVolunteerMap({
  volunteers = [],
  feeders = [],
  showCoverageZones = false,
  showConnections = false,
  showHeatmap = false,
  show3DBuildings = false
}: MapProps) {
  const [markersLoaded, setMarkersLoaded] = useState(false); // Track if markers already animated
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerData | null>(null);
  const [selectedFeeder, setSelectedFeeder] = useState<FeederData | null>(null);
  const [viewState, setViewState] = useState({
    longitude: BANGALORE_CENTER.longitude,
    latitude: BANGALORE_CENTER.latitude,
    zoom: 11
  });

  const mapRef = useRef<MapRef>(null);

  // Trigger marker animations once data is loaded
  useEffect(() => {
    if (volunteers.length > 0 || feeders.length > 0) {
      setTimeout(() => setMarkersLoaded(true), 500);
    }
  }, [volunteers.length, feeders.length]);

  // Helper to get volunteer color based on help types (memoized)
  const getVolunteerColor = useCallback((helpTypes: string[]) => {
    if (helpTypes.includes('build')) return '#3B82F6'; // Blue
    if (helpTypes.includes('refill')) return '#10B981'; // Green
    return '#F59E0B'; // Amber
  }, []);

  // Helper to get feeder color based on status (memoized)
  const getFeederColor = useCallback((feeder: FeederData) => {
    const isOverdue = feeder.next_refill_due && new Date(feeder.next_refill_due) < new Date();
    if (isOverdue) return '#EF4444'; // Red
    if (feeder.status === 'active') return '#10B981'; // Green
    return '#F59E0B'; // Yellow
  }, []);

  // Create GeoJSON for coverage zones
  const coverageZonesGeoJSON = useMemo(() => {
    if (!showCoverageZones || feeders.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: feeders.map(feeder => ({
        type: 'Feature',
        properties: {
          id: feeder.id,
          location: feeder.location_name
        },
        geometry: {
          type: 'Point',
          coordinates: [feeder.longitude, feeder.latitude]
        }
      }))
    };
  }, [feeders, showCoverageZones]);

  // Create GeoJSON for heatmap (combines volunteers and feeders)
  const heatmapGeoJSON = useMemo(() => {
    if (!showHeatmap) return null;

    const features = [
      // Volunteer points
      ...volunteers.map(volunteer => ({
        type: 'Feature' as const,
        properties: {
          type: 'volunteer',
          weight: 1
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [volunteer.longitude, volunteer.latitude]
        }
      })),
      // Feeder points (weighted higher)
      ...feeders.map(feeder => ({
        type: 'Feature' as const,
        properties: {
          type: 'feeder',
          weight: 2
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [feeder.longitude, feeder.latitude]
        }
      }))
    ];

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [volunteers, feeders, showHeatmap]);

  // Create GeoJSON for connection lines (connect nearby volunteers to feeders)
  const connectionLinesGeoJSON = useMemo(() => {
    if (!showConnections || volunteers.length === 0 || feeders.length === 0) return null;

    // Connect each volunteer to their nearest feeder (within 5km)
    const features = volunteers.flatMap(volunteer => {
      // Find nearest feeder
      const nearbyFeeders = feeders.map(feeder => {
        // Simple distance calculation
        const distance = Math.sqrt(
          Math.pow(feeder.latitude - volunteer.latitude, 2) +
          Math.pow(feeder.longitude - volunteer.longitude, 2)
        );
        return { feeder, distance };
      })
      .filter(f => f.distance < 0.05) // ~5km radius
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2); // Max 2 connections per volunteer

      return nearbyFeeders.map(({ feeder }) => ({
        type: 'Feature' as const,
        properties: {
          volunteerName: volunteer.name,
          feederName: feeder.location_name,
          helpType: volunteer.help_types[0] || 'general'
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [volunteer.longitude, volunteer.latitude],
            [feeder.longitude, feeder.latitude]
          ]
        }
      }));
    });

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [volunteers, feeders, showConnections]);

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11" // Light, clean style - easier to customize
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        // Better UX settings
        dragRotate={false}
        touchZoomRotate={false}
        pitch={show3DBuildings ? 45 : 0} // Tilt map for 3D effect
        minZoom={9}
        maxZoom={18}
      >
        {/* Heatmap Layer (density visualization) */}
        {showHeatmap && heatmapGeoJSON && (
          <Source id="heatmap" type="geojson" data={heatmapGeoJSON as GeoJSON.FeatureCollection}>
            <Layer
              id="heatmap-layer"
              type="heatmap"
              paint={{
                // Increase weight as diameter increases
                'heatmap-weight': [
                  'interpolate',
                  ['linear'],
                  ['get', 'weight'],
                  0, 0,
                  1, 0.5,
                  2, 1
                ],
                // Increase intensity as zoom level increases
                'heatmap-intensity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, 0.5,
                  11, 1,
                  15, 2
                ],
                // Color ramp for heatmap
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(33,102,172,0)',
                  0.2, 'rgb(103,169,207)',
                  0.4, 'rgb(209,229,240)',
                  0.6, 'rgb(253,219,199)',
                  0.8, 'rgb(239,138,98)',
                  1, 'rgb(178,24,43)'
                ],
                // Adjust the radius at different zoom levels
                'heatmap-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, 15,
                  11, 25,
                  15, 40
                ],
                // Fade out at high zoom
                'heatmap-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, 0.8,
                  14, 0.6,
                  16, 0.2
                ]
              }}
            />
          </Source>
        )}

        {/* Coverage Zones Layer (circles around feeders) */}
        {showCoverageZones && coverageZonesGeoJSON && (
          <Source id="coverage-zones" type="geojson" data={coverageZonesGeoJSON as GeoJSON.FeatureCollection}>
            <Layer
              id="coverage-zones-layer"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, 20,
                  12, 100,
                  15, 200
                ],
                'circle-color': '#10B981',
                'circle-opacity': 0.15,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#10B981',
                'circle-stroke-opacity': 0.4
              }}
            />
          </Source>
        )}

        {/* Connection Lines Layer (volunteer → feeder connections) */}
        {showConnections && connectionLinesGeoJSON && (
          <Source id="connections" type="geojson" data={connectionLinesGeoJSON as GeoJSON.FeatureCollection}>
            <Layer
              id="connections-layer"
              type="line"
              paint={{
                'line-color': '#E07856', // GiveGood primary color (terracotta)
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2] // Animated dashed line effect
              }}
            />
          </Source>
        )}

        {/* 3D Buildings Layer (with GiveGood branding) */}
        {show3DBuildings && (
          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            filter={['==', 'extrude', 'true']}
            type="fill-extrusion"
            minzoom={14}
            paint={{
              'fill-extrusion-color': '#F5E6D3', // GiveGood secondary (beige)
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 0,
                14.05, ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 0,
                14.05, ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.7
            }}
          />
        )}

        {/* Volunteer Markers */}
        {volunteers.map((volunteer, index) => (
          <Marker
            key={`volunteer-${volunteer.id}`}
            longitude={volunteer.longitude}
            latitude={volunteer.latitude}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedVolunteer(volunteer);
              setSelectedFeeder(null);
            }}
          >
            <motion.div
              initial={markersLoaded ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={markersLoaded ? { duration: 0 } : { delay: index * 0.02, duration: 0.3 }}
              className="cursor-pointer hover:scale-125 transition-transform"
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: getVolunteerColor(volunteer.help_types),
                border: '2px solid white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
          </Marker>
        ))}

        {/* Feeder Markers */}
        {feeders.map((feeder, index) => (
          <Marker
            key={`feeder-${feeder.id}`}
            longitude={feeder.longitude}
            latitude={feeder.latitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedFeeder(feeder);
              setSelectedVolunteer(null);
            }}
          >
            <motion.div
              initial={markersLoaded ? { scale: 1, y: 0, opacity: 1 } : { scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={markersLoaded ? { duration: 0 } : { delay: (volunteers.length * 0.02) + (index * 0.03), duration: 0.4 }}
              className="cursor-pointer hover:scale-110 transition-transform"
            >
              {/* Feeder Icon (House) */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: getFeederColor(feeder),
                  borderRadius: '6px 6px 6px 2px',
                  border: '2px solid white',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {/* Simple house roof */}
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid white',
                    position: 'absolute',
                    top: '4px'
                  }}
                />
              </div>
            </motion.div>
          </Marker>
        ))}

        {/* Volunteer Popup */}
        {selectedVolunteer && (
          <Popup
            longitude={selectedVolunteer.longitude}
            latitude={selectedVolunteer.latitude}
            anchor="top"
            onClose={() => setSelectedVolunteer(null)}
            closeButton={true}
            closeOnClick={false}
            className="volunteer-popup"
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedVolunteer.name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                📍 {selectedVolunteer.area_name || selectedVolunteer.area}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Pincode: {selectedVolunteer.pincode}
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedVolunteer.help_types.map(type => (
                  <span
                    key={type}
                    className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700"
                  >
                    {type === 'build' ? '🔨 Builder' : 
                     type === 'refill' ? '🥣 Refiller' : 
                     '📢 Ambassador'}
                  </span>
                ))}
              </div>
            </div>
          </Popup>
        )}

        {/* Feeder Popup */}
        {selectedFeeder && (
          <Popup
            longitude={selectedFeeder.longitude}
            latitude={selectedFeeder.latitude}
            anchor="top"
            onClose={() => setSelectedFeeder(null)}
            closeButton={true}
            closeOnClick={false}
            className="feeder-popup"
          >
            <div className="p-2 min-w-[220px]">
              <h3 className="font-semibold text-gray-900 mb-1">
                🏠 {selectedFeeder.location_name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                📍 {selectedFeeder.area_name || 'Bangalore'}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Pincode: {selectedFeeder.pincode}
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    selectedFeeder.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {selectedFeeder.status}
                  </span>
                </div>
                {selectedFeeder.capacity_kg && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{selectedFeeder.capacity_kg} kg</span>
                  </div>
                )}
                {selectedFeeder.last_refilled_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Refilled:</span>
                    <span className="font-medium">
                      {new Date(selectedFeeder.last_refilled_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map Legend - Glassmorphism */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl p-3 z-10 border border-white/20">
        <h4 className="text-xs font-bold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 font-medium">Builders</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 font-medium">Refillers</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 font-medium">Ambassadors</span>
          </div>
          <div className="my-1.5 border-t border-gray-200"></div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-green-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 font-medium">Active Feeder</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-red-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 font-medium">Needs Refill</span>
          </div>
        </div>
      </div>
    </div>
  );
}

