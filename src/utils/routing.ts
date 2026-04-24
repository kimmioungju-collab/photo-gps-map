import type { LatLng } from '../types/photo';

export interface RouteResult {
  path: LatLng[];       // polyline points along actual roads
  distanceM: number;    // total distance in meters
  durationS: number;    // total estimated duration in seconds
  provider: 'osrm' | 'fallback';
}

/**
 * Fetch a driving route through the given waypoints using the public OSRM
 * demo server. Falls back to straight-line segments if the service fails.
 */
export async function fetchDrivingRoute(points: LatLng[]): Promise<RouteResult> {
  if (points.length < 2) {
    return { path: points, distanceM: 0, durationS: 0, provider: 'fallback' };
  }

  // OSRM public server allows up to ~100 waypoints per request
  const coordStr = points
    .map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`)
    .join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates) throw new Error('no route');
    const path: LatLng[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );
    return {
      path,
      distanceM: route.distance ?? 0,
      durationS: route.duration ?? 0,
      provider: 'osrm',
    };
  } catch (err) {
    console.warn('[routing] OSRM failed, using straight lines:', err);
    // Fallback: use straight-line segments + haversine distance
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      dist += haversine(points[i - 1], points[i]);
    }
    return {
      path: points,
      distanceM: dist,
      durationS: 0,
      provider: 'fallback',
    };
  }
}

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function formatDuration(s: number): string {
  if (s <= 0) return '–';
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}
