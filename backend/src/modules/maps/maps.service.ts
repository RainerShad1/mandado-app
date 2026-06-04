import { Injectable, Logger } from '@nestjs/common';

export interface LatLng { lat: number; lng: number }
export interface DistanceResult {
  distanceKm: number;
  durationMin: number;
  source: 'google' | 'haversine'; // de dónde salió el dato
}

// Punto de origen del negocio (la base de operaciones). Cámbialo a tu local.
export const BASE_LOCATION: LatLng = { lat: 18.427, lng: -68.972 }; // La Romana, RD

@Injectable()
export class MapsService {
  private logger = new Logger('Maps');
  private get key() { return process.env.GOOGLE_MAPS_KEY || ''; }

  // Distancia real por carretera usando Google Distance Matrix API.
  // Si no hay llave o falla, usa el cálculo en línea recta (Haversine).
  async distance(from: LatLng, to: LatLng): Promise<DistanceResult> {
    if (this.key) {
      try {
        return await this.googleDistance(from, to);
      } catch (e: any) {
        this.logger.warn(`Google Maps falló, uso Haversine: ${e.message}`);
      }
    }
    const km = haversineKm(from, to);
    return { distanceKm: km, durationMin: Math.round(km * 2.5), source: 'haversine' };
  }

  private async googleDistance(from: LatLng, to: LatLng): Promise<DistanceResult> {
    const origin = `${from.lat},${from.lng}`;
    const dest = `${to.lat},${to.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`
      + `?origins=${origin}&destinations=${dest}`
      + `&mode=driving&units=metric&key=${this.key}`;

    const res = await fetch(url);
    const data: any = await res.json();
    if (data.status !== 'OK') throw new Error(data.error_message || data.status);
    const el = data.rows?.[0]?.elements?.[0];
    if (!el || el.status !== 'OK') throw new Error(el?.status || 'NO_RESULT');

    return {
      distanceKm: +(el.distance.value / 1000).toFixed(2), // metros -> km
      durationMin: Math.round(el.duration.value / 60),     // segundos -> min
      source: 'google',
    };
  }

  // Geocodificación: convierte texto de dirección en lat/lng.
  // Útil si el cliente escribe la dirección a mano sin usar el mapa.
  async geocode(address: string): Promise<LatLng | null> {
    if (!this.key) return null;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json`
        + `?address=${encodeURIComponent(address)}&key=${this.key}`;
      const res = await fetch(url);
      const data: any = await res.json();
      if (data.status !== 'OK') return null;
      const loc = data.results?.[0]?.geometry?.location;
      return loc ? { lat: loc.lat, lng: loc.lng } : null;
    } catch {
      return null;
    }
  }
}

// Fórmula Haversine (distancia en línea recta). Respaldo cuando no hay Google.
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return +(2 * R * Math.asin(Math.sqrt(h))).toFixed(2);
}
