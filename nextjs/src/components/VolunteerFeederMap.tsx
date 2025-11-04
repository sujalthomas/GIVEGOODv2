"use client";
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
if (typeof window !== 'undefined') {
  // Leaflet's Icon.Default has internal private property _getIconUrl that needs to be deleted
  // for custom icon URLs to work. Type assertion is necessary due to private property access.
  const iconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string };
  delete iconPrototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

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
  showCoverageZones?: boolean;
  showConnections?: boolean;
  showHeatmap?: boolean;
  adminMode?: boolean;
}

// Custom volunteer icon creator
const createVolunteerIcon = (helpTypes: string[]) => {
  const color = helpTypes.includes('build') ? '#3B82F6' : 
                helpTypes.includes('refill') ? '#10B981' : '#F59E0B';
  
  return L.divIcon({
    className: 'custom-volunteer-marker',
    html: `<div style="
      width: 16px;
      height: 16px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Custom feeder icon creator
const createFeederIcon = (status: string, isOverdue: boolean) => {
  const color = isOverdue ? '#EF4444' : 
                status === 'active' ? '#10B981' : '#F59E0B';
  
  return L.divIcon({
    className: 'custom-feeder-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 4px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function VolunteerFeederMap({
  showCoverageZones = true
}: MapProps) {
  const [volunteers, setVolunteers] = useState<VolunteerData[]>([]);
  const [feeders, setFeeders] = useState<FeederData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const [volunteersRes, feedersRes] = await Promise.all([
        fetch('/api/map/volunteers'),
        fetch('/api/map/feeders')
      ]);

      const volunteersData = await volunteersRes.json();
      const feedersData = await feedersRes.json();

      setVolunteers(volunteersData.volunteers || []);
      setFeeders(feedersData.feeders || []);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeederOverdue = (feeder: FeederData) => {
    if (!feeder.next_refill_due) return false;
    return new Date(feeder.next_refill_due) < new Date();
  };

  // Bangalore center coordinates
  const bangaloreCenter: [number, number] = [12.9716, 77.5946];

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
      <MapContainer
        center={bangaloreCenter}
        zoom={11}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Volunteer Markers */}
        {volunteers.map((volunteer) => (
          <Marker
            key={volunteer.id}
            position={[volunteer.latitude, volunteer.longitude]}
            icon={createVolunteerIcon(volunteer.help_types)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-gray-900">{volunteer.name}</h3>
                <p className="text-sm text-gray-600">{volunteer.area}</p>
                <p className="text-xs text-gray-500 font-mono">PIN: {volunteer.pincode}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {volunteer.help_types.map(type => (
                    <span key={type} className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Feeder Markers */}
        {feeders.map((feeder) => (
          <React.Fragment key={feeder.id}>
            <Marker
              position={[feeder.latitude, feeder.longitude]}
              icon={createFeederIcon(feeder.status, isFeederOverdue(feeder))}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-gray-900">{feeder.location_name}</h3>
                  <p className="text-sm text-gray-600">{feeder.area_name || feeder.pincode}</p>
                  {feeder.capacity_kg && (
                    <p className="text-xs text-gray-500">Capacity: {feeder.capacity_kg} kg</p>
                  )}
                  {feeder.last_refilled_at && (
                    <p className="text-xs text-gray-500">
                      Last refilled: {new Date(feeder.last_refilled_at).toLocaleDateString('en-IN')}
                    </p>
                  )}
                  {isFeederOverdue(feeder) && (
                    <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Needs refill</p>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Coverage Zone */}
            {showCoverageZones && (
              <Circle
                center={[feeder.latitude, feeder.longitude]}
                radius={2000} // 2km radius
                pathOptions={{
                  color: '#10B981',
                  fillColor: '#10B981',
                  fillOpacity: 0.1,
                  weight: 1,
                  className: 'coverage-zone'
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}

