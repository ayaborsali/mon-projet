import { ParkingConfig } from '../types/parking';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const configService = {
  async getParkingConfig(): Promise<ParkingConfig | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/parking`);
      if (!response.ok) throw new Error('Failed to fetch config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching parking config:', error);
      return null;
    }
  },

  async updateParkingConfig(config: Partial<ParkingConfig>): Promise<ParkingConfig> {
    const response = await fetch(`${API_BASE_URL}/config/parking`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Failed to update config');
    return await response.json();
  }
};