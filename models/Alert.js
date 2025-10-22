const mongoose = require('mongoose');
const alertSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['success', 'warning', 'error'] },
  message: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  read: { type: Boolean, default: false }
});
module.exports = mongoose.model('Alert', alertSchema);
