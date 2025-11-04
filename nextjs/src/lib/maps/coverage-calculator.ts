interface Location {
  latitude: number;
  longitude: number;
}

interface CoverageZone {
  pincode: string;
  area: string;
  latitude: number;
  longitude: number;
  isCovered: boolean;
  feederCount: number;
  volunteerCount: number;
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a location is covered by any feeder within radius
 */
export function isLocationCovered(
  location: Location,
  feeders: Location[],
  coverageRadiusKm: number = 2
): boolean {
  return feeders.some(feeder =>
    calculateDistance(
      location.latitude,
      location.longitude,
      feeder.latitude,
      feeder.longitude
    ) <= coverageRadiusKm
  );
}

/**
 * Calculate overall coverage percentage for Bangalore
 */
export function calculateBangaloreCoverage(
  areas: Array<{ latitude: number; longitude: number }>,
  feeders: Array<{ latitude: number; longitude: number }>,
  coverageRadiusKm: number = 2
): number {
  if (areas.length === 0) return 0;
  
  const coveredAreas = areas.filter(area =>
    isLocationCovered(area, feeders, coverageRadiusKm)
  );
  
  return Math.round((coveredAreas.length / areas.length) * 100);
}

/**
 * Calculate coverage score for a specific area
 */
export function calculateAreaCoverage(
  areaCenterLat: number,
  areaCenterLon: number,
  feedersInArea: number,
  volunteersInArea: number
): number {
  // Simple scoring: More feeders + volunteers = better coverage
  // Max score: 100%
  
  const feederScore = Math.min(feedersInArea * 10, 60); // Max 60% from feeders
  const volunteerScore = Math.min(volunteersInArea * 5, 40); // Max 40% from volunteers
  
  return Math.min(feederScore + volunteerScore, 100);
}

/**
 * Get coverage zones for all pincodes
 */
export function getCoverageZones(
  pincodes: Record<string, { area: string; latitude: number; longitude: number }>,
  feeders: Array<{ pincode: string; latitude: number; longitude: number }>,
  volunteers: Array<{ pincode: string; latitude: number; longitude: number }>
): CoverageZone[] {
  const zones: CoverageZone[] = [];
  
  for (const [pincode, data] of Object.entries(pincodes)) {
    const feedersInZone = feeders.filter(f => f.pincode === pincode);
    const volunteersInZone = volunteers.filter(v => v.pincode === pincode);
    
    const isCovered = feedersInZone.length > 0;
    
    zones.push({
      pincode,
      area: data.area,
      latitude: data.latitude,
      longitude: data.longitude,
      isCovered,
      feederCount: feedersInZone.length,
      volunteerCount: volunteersInZone.length
    });
  }
  
  return zones;
}

