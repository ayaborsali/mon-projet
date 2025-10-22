import { ObjectId } from 'mongodb';

// GET /api/payments - Récupérer TOUS les paiements AVEC données sessions
export const getPayments = async (db) => async (req, res) => {
  try {
    console.log('📊 Endpoint /api/payments appelé');
    
    const paymentsCollection = db.collection('payments');
    const sessionsCollection = db.collection('sessions');
    
    // Récupérer tous les paiements avec jointure sur sessions
    const payments = await paymentsCollection.aggregate([
      {
        $lookup: {
          from: 'sessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'sessionData'
        }
      },
      {
        $unwind: {
          path: '$sessionData',
          preserveNullAndEmptyArrays: true // Garder les paiements même si session non trouvée
        }
      },
      {
        $project: {
          _id: 1,
          sessionId: 1,
          amount: 1,
          paymentMethod: 1,
          status: 1,
          paymentTime: 1,
          reference: 1,
          createdAt: 1,
          updatedAt: 1,
          // Données de la session
          plate: '$sessionData.plate',
          vehicleType: '$sessionData.vehicleType',
          spaceNumber: '$sessionData.spaceNumber'
        }
      },
      {
        $sort: { paymentTime: -1 }
      }
    ]).toArray();
    
    console.log(`✅ ${payments.length} paiements récupérés avec données sessions`);
    
    res.json(payments);
  } catch (error) {
    console.error('❌ Erreur récupération paiements:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des paiements',
      details: error.message 
    });
  }
};