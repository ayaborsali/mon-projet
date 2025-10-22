const mongoose = require('mongoose');

const parkingSpaceSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['voiture', 'camion', 'moto'],
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['voiture', 'camion', 'moto'],
    required: true
  },
  zone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['libre', 'occupé', 'réservé', 'hors-service'],
    default: 'libre'
  },
  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  reservation: {
    plate: String,
    vehicleType: String,
    expiresAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour updatedAt
parkingSpaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ParkingSpace', parkingSpaceSchema);