import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

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

    // Geocode the pincode
    const coords = await geocodePincode(body.pincode);

    if (!coords) {
      return NextResponse.json(
        { error: 'Failed to geocode pincode' },
        { status: 404 }
      );
    }

    // Update volunteer with coordinates
    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();

    const { error: updateError } = await supabase
      .from('volunteers')
      .update({
        latitude: coords.lat,
        longitude: coords.lon
      })
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
      longitude: coords.lon
    });

  } catch (error) {
    console.error('Error in geocode API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

