// src/services/parkingService.ts
import { ObjectId } from 'mongodb';
import { getDb } from '../../config/mongodb';
import { ParkingSpace } from '../types/parking';

export const parkingSpaceService = {
  // S'abonner aux changements des places de parking
  subscribeToParkingSpaces: (callback: (spaces: ParkingSpace[]) => void) => {
    const db = getDb();
    const spacesCollection = db.collection('parkingSpaces');
    
    const pollSpaces = async () => {
      try {
        const spaces = await spacesCollection.find().toArray();
        const formattedSpaces: ParkingSpace[] = spaces.map(space => ({
          id: space._id.toString(),
          number: space.number,
          zone: space.zone,
          type: space.type,
          status: space.status,
          reservation: space.reservation ? {
            plate: space.reservation.plate,
            vehicleType: space.reservation.vehicleType,
            expiresAt: space.reservation.expiresAt,
            createdAt: space.reservation.createdAt
          } : undefined,
          currentSessionId: space.currentSessionId,
          createdAt: space.createdAt,
          updatedAt: space.updatedAt
        }));
        callback(formattedSpaces);
      } catch (error) {
        console.error('Error fetching parking spaces:', error);
      }
    };

    pollSpaces();
    const interval = setInterval(pollSpaces, 5000);

    return () => clearInterval(interval);
  },

  // Occuper une place
  occupySpace: async (spaceNumber: string, sessionId: string, plate: string, vehicleType: string) => {
    try {
      const db = getDb();
      const spacesCollection = db.collection('parkingSpaces');
      const now = new Date();

      const result = await spacesCollection.updateOne(
        { number: spaceNumber },
        {
          $set: {
            status: 'occupé',
            currentSessionId: sessionId,
            updatedAt: now
          },
          $unset: {
            reservation: ""
          }
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error(`Place ${spaceNumber} non trouvée ou déjà occupée`);
      }

      console.log(`✅ Place ${spaceNumber} occupée par session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur occupation place:', error);
      throw error;
    }
  },

  // Libérer une place
  freeSpace: async (spaceNumber: string, sessionId: string) => {
    try {
      const db = getDb();
      const spacesCollection = db.collection('parkingSpaces');
      const now = new Date();

      const result = await spacesCollection.updateOne(
        { 
          number: spaceNumber,
          currentSessionId: sessionId 
        },
        {
          $set: {
            status: 'libre',
            updatedAt: now
          },
          $unset: {
            currentSessionId: ""
          }
        }
      );

      if (result.modifiedCount === 0) {
        console.warn(`⚠️ Place ${spaceNumber} non trouvée ou session mismatch`);
        return false;
      }

      console.log(`✅ Place ${spaceNumber} libérée de session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur libération place:', error);
      throw error;
    }
  },

  // Réserver une place
  reserveSpace: async (spaceNumber: string, plate: string, vehicleType: string, durationMinutes: number = 30) => {
    try {
      const db = getDb();
      const spacesCollection = db.collection('parkingSpaces');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

      const result = await spacesCollection.updateOne(
        { 
          number: spaceNumber,
          status: 'libre'
        },
        {
          $set: {
            status: 'réservé',
            reservation: {
              plate: plate.toUpperCase(),
              vehicleType,
              expiresAt,
              createdAt: now
            },
            updatedAt: now
          }
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error(`Place ${spaceNumber} non disponible pour réservation`);
      }

      console.log(`✅ Place ${spaceNumber} réservée pour ${plate}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur réservation place:', error);
      throw error;
    }
  },

  // Mettre une place hors service
  setSpaceOutOfService: async (spaceNumber: string, reason: string) => {
    try {
      const db = getDb();
      const spacesCollection = db.collection('parkingSpaces');
      const now = new Date();

      const result = await spacesCollection.updateOne(
        { number: spaceNumber },
        {
          $set: {
            status: 'hors-service',
            updatedAt: now,
            outOfServiceReason: reason
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ Erreur mise hors service:', error);
      throw error;
    }
  }
};