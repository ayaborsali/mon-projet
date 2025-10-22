const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  vehicle: {
    id: String,
    plate: { type: String, required: true },
    type: { type: String, enum: ['voiture', 'camion', 'moto'], default: 'voiture' }
  },
  spaceNumber: { type: String, required: true },
  entryTime: { type: Date, default: Date.now },
  exitTime: Date,
  status: { type: String, enum: ['active', 'terminé', 'payé'], default: 'active' },
  amount: Number,
  paymentMethod: { type: String, enum: ['espèces', 'carte', 'mobile_money', 'portefeuille'] },
  photos: {
    entry: String,
    exit: String
  },
  duration: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);