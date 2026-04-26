import { italianNeighborhoods } from '../data/neighborhoods';

export class GeoService {
  getNeighborhoods(city: string): string[] {
    const normalizedCity = city.toLowerCase().trim();
    return italianNeighborhoods[normalizedCity] || [];
  }

  getNearbyNeighborhoods(city: string, current: string, limit: number = 3): string[] {
    const neighborhoods = this.getNeighborhoods(city);
    if (neighborhoods.length === 0) return [];

    // Simple proximity logic for now: pick random or adjacent ones
    // In future, this could be real GIS-based distance
    return neighborhoods
      .filter(n => n.toLowerCase() !== current.toLowerCase())
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, limit);
  }
}
