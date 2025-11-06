import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';
import { getCoordinatesFromPincode, getAreaNameFromPincode } from '@/lib/geocoding/bangalore-pincodes';

interface GeocodeRequest {
  volunteerId: string;
  pincode: string;
}

// Nominatim API with rate limiting (1 req/sec)
async function geocodePincode(pincode: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GiveGoodClub/1.0 (contact@givegoodclub.org)' // Required by Nominatim
      }
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GeocodeRequest = await request.json();

    if (!body.volunteerId || !body.pincode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Try Nominatim API first
    let coords = await geocodePincode(body.pincode);
    let source = 'nominatim';

    // If Nominatim fails, use our local pincode reference as fallback
    if (!coords) {
      console.log(`Nominatim failed for ${body.pincode}, using local reference`);
      const localCoords = getCoordinatesFromPincode(body.pincode);
      
      if (localCoords) {
        coords = localCoords;
        source = 'local_reference';
      }
    }

    // If both fail, return error
    if (!coords) {
      return NextResponse.json(
        { error: `Failed to geocode pincode ${body.pincode} - not found in Nominatim or local reference` },
        { status: 404 }
      );
    }

    // Update volunteer with coordinates
    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();

    // Also get area name from reference if available
    const areaName = getAreaNameFromPincode(body.pincode);

    const updateData: {
      latitude: number;
      longitude: number;
      area_name?: string;
    } = {
      latitude: coords.lat,
      longitude: coords.lon
    };

    if (areaName) {
      updateData.area_name = areaName;
    }

    const { error: updateError } = await supabase
      .from('volunteers')
      .update(updateData)
      .eq('id', body.volunteerId);

    if (updateError) {
      console.error('Error updating coordinates:', updateError);
      return NextResponse.json(
        { error: 'Failed to update coordinates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      latitude: coords.lat,
      longitude: coords.lon,
      area_name: areaName,
      source: source
    });

  } catch (error) {
    console.error('Error in geocode API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

