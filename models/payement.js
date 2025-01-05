const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  notes: { type: String, default: "Nous avons reçu votre paiement et il est en cours de traitement" },
  paymentProof: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // Pending, approved, rejected
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
  