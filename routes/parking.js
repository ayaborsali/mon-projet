// server/routes/parking.js
const express = require('express');
const router = express.Router();
const ParkingSession = require('../models/ParkingSession');
const ParkingSpace = require('../models/ParkingSpace');
const Notification = require('../models/Notification');

// GET toutes les sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await ParkingSession.find().sort({ entryTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST nouvelle session
router.post('/sessions', async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      entryTime: new Date(),
      status: 'active'
    };
    
    const newSession = new ParkingSession(sessionData);
    await newSession.save();
    
    // Mettre à jour la place
    await ParkingSpace.findOneAndUpdate(
      { number: req.body.spaceNumber },
      { 
        status: 'occupé',
        currentSessionId: newSession._id,
        updatedAt: new Date()
      }
    );
    
    res.status(201).json(newSession);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT terminer une session
router.put('/sessions/:id/end', async (req, res) => {
  try {
    const session = await ParkingSession.findById(req.params.id);
    const updatedSession = await ParkingSession.findByIdAndUpdate(
      req.params.id,
      {
        exitTime: new Date(),
        status: 'terminé',
        amount: req.body.amount,
        duration: req.body.duration,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    // Libérer la place
    await ParkingSpace.findOneAndUpdate(
      { number: session.spaceNumber },
      { 
        status: 'libre',
        currentSessionId: null,
        updatedAt: new Date()
      }
    );
    
    res.json(updatedSession);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;