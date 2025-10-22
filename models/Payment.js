const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['espèces', 'carte', 'mobile_money', 'portefeuille']
  },
  paymentTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  reference: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Générer une référence avant sauvegarde
paymentSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Index pour les performances
paymentSchema.index({ sessionId: 1 });
paymentSchema.index({ paymentTime: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);