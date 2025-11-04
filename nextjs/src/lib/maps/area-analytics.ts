import { createSPAClient } from '@/lib/supabase/client';

export interface AreaMetrics {
  pincode: string;
  areaName: string;
  volunteerCount: number;
  feederCount: number;
  activeFeederCount: number;
  totalRefills30d: number;
  coveragePercent: number;
  healthScore: number;
  rank: number;
}

/**
 * Fetch and calculate analytics for all areas
 */
export async function getAreaAnalytics(): Promise<AreaMetrics[]> {
  try {
    const supabase = createSPAClient();
    
    // Use the database function we created in migration
    const { data, error } = await supabase
      .rpc('get_area_stats');
    
    if (error) {
      console.error('Error fetching area stats:', error);
      return [];
    }
    
    if (!data || !Array.isArray(data)) return [];
    
    interface RawAreaData {
      pincode: string;
      area_name: string | null;
      volunteer_count: number;
      feeder_count: number;
      active_feeder_count: number;
      total_refills_30d: number;
      avg_coverage_percent: number;
    }
    
    // Calculate health score and rank
    const metricsWithScores = (data as RawAreaData[]).map((area) => ({
      pincode: area.pincode,
      areaName: area.area_name || area.pincode,
      volunteerCount: area.volunteer_count,
      feederCount: area.feeder_count,
      activeFeederCount: area.active_feeder_count,
      totalRefills30d: area.total_refills_30d,
      coveragePercent: area.avg_coverage_percent,
      healthScore: calculateHealthScore(
        area.active_feeder_count,
        area.feeder_count,
        area.total_refills_30d
      ),
      rank: 0 // Will be set after sorting
    }));
    
    // Sort by coverage percent (descending) and assign ranks
    metricsWithScores.sort((a, b) => b.coveragePercent - a.coveragePercent);
    metricsWithScores.forEach((area, index) => {
      area.rank = index + 1;
    });
    
    return metricsWithScores;
    
  } catch (error) {
    console.error('Error in getAreaAnalytics:', error);
    return [];
  }
}

/**
 * Calculate health score (0-100)
 * Based on: active feeders, refill frequency
 */
function calculateHealthScore(
  activeFeeders: number,
  totalFeeders: number,
  refills30d: number
): number {
  if (totalFeeders === 0) return 0;
  
  // Active feeders ratio (60% weight)
  const activeRatio = (activeFeeders / totalFeeders) * 60;
  
  // Refill frequency score (40% weight)
  // Assume ideal: 1 refill per feeder per week = 4.3 refills per month
  const idealRefills = activeFeeders * 4.3;
  const refillScore = idealRefills > 0 
    ? Math.min((refills30d / idealRefills), 1) * 40 
    : 0;
  
  return Math.round(activeRatio + refillScore);
}

/**
 * Get top N areas by coverage
 */
export async function getTopAreas(limit: number = 6): Promise<AreaMetrics[]> {
  const allAreas = await getAreaAnalytics();
  return allAreas.slice(0, limit);
}

/**
 * Get areas needing attention (low coverage or health)
 */
export async function getAreasNeedingAttention(): Promise<AreaMetrics[]> {
  const allAreas = await getAreaAnalytics();
  
  return allAreas.filter(
    area => area.coveragePercent < 50 || area.healthScore < 60
  );
}

