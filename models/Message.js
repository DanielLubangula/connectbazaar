const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  content: { type: String, default: null }, // Pour les messages texte
  images: [
    {
      path: { type: String, required: true },
      contentType: { type: String, required: true },
    },
  ],
  audios: [
    {
      path: { type: String, required: true },
      contentType: { type: String, required: true },
      duration: { type: Number }, // Durée en secondes
    },
  ],
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  unread: { type: Boolean, default: true }, // champ pour les notifications
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }, // ID du message parent (null si c'est un message principal)
  isDelete : { type : Boolean , default : false}
});

module.exports = mongoose.model('Message', MessageSchema);
