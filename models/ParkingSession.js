// server/models/ParkingSession.js
const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema({
  vehicle: {
    plate: { type: String, required: true, uppercase: true },
    type: { type: String, enum: ['voiture', 'camion', 'moto'], required: true }
  },
  spaceNumber: { type: String, required: true },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'terminé', 'payé'], 
    default: 'active' 
  },
  amount: { type: Number },
  paymentMethod: { 
    type: String, 
    enum: ['espèces', 'carte', 'mobile_money', 'portefeuille'] 
  },
  photos: {
    entry: { type: String },
    exit: { type: String }
  },
  duration: { type: Number }, // en minutes
}, {
  timestamps: true
});

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);