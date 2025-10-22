const express = require('express');
const router = express.Router();
const ParkingSpace = require('../models/ParkingSpace');

// GET /api/parking-spaces - Récupérer toutes les places
router.get('/', async (req, res) => {
  try {
    const parkingSpaces = await ParkingSpace.find().sort({ number: 1 });
    res.json(parkingSpaces);
  } catch (error) {
    console.error('❌ Erreur récupération places:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des places' });
  }
});

// GET /api/parking-spaces/:id - Récupérer une place par ID
router.get('/:id', async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);
    if (!parkingSpace) {
      return res.status(404).json({ error: 'Place non trouvée' });
    }
    res.json(parkingSpace);
  } catch (error) {
    console.error('❌ Erreur récupération place:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la place' });
  }
});

// PUT /api/parking-spaces/:id - Mettre à jour une place
router.put('/:id', async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };

    const parkingSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!parkingSpace) {
      return res.status(404).json({ error: 'Place non trouvée' });
    }

    res.json(parkingSpace);
  } catch (error) {
    console.error('❌ Erreur mise à jour place:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données de validation invalides' });
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la place' });
  }
});

// PATCH /api/parking-spaces/:id - Mettre à jour partiellement une place
router.patch('/:id', async (req, res)) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };

    const parkingSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!parkingSpace) {
      return res.status(404).json({ error: 'Place non trouvée' });
    }

    res.json(parkingSpace);
  } catch (error) {
    console.error('❌ Erreur ')} }