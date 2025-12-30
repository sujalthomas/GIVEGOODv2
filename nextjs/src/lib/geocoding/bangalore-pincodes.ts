import bangalorePincodes from '@/lib/maps/bangalore-pincodes.json';

export interface PincodeData {
  area: string;
  latitude: number;
  longitude: number;
  locality: string;
}

export function validateBangalorePincode(pincode: string): boolean {
  return /^560\d{3}$/.test(pincode);
}

export function getPincodeData(pincode: string): PincodeData | null {
  return (bangalorePincodes as Record<string, PincodeData>)[pincode] || null;
}

export function getAreaNameFromPincode(pincode: string): string | null {
  const data = getPincodeData(pincode);
  return data?.area || null;
}

export function getCoordinatesFromPincode(pincode: string): { lat: number; lon: number } | null {
  const data = getPincodeData(pincode);
  return data ? { lat: data.latitude, lon: data.longitude } : null;
}

export function getAllBangalorePincodes(): string[] {
  return Object.keys(bangalorePincodes);
}

export function searchPincodesByArea(searchTerm: string, limit?: number): Array<{ pincode: string; data: PincodeData }> {
  const results: Array<{ pincode: string; data: PincodeData }> = [];
  const lowerSearch = searchTerm.toLowerCase();
  
  for (const [pincode, data] of Object.entries(bangalorePincodes as Record<string, PincodeData>)) {
    if (
      data.area.toLowerCase().includes(lowerSearch) ||
      data.locality.toLowerCase().includes(lowerSearch)
    ) {
      results.push({ pincode, data });
      if (limit && results.length >= limit) break;
    }
  }
  
  return results;
}

