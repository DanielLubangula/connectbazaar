// models/Order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Référence à l'utilisateur acheteur
        required: true
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',  // Référence aux produits achetés
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['en attente', 'livré'],  // Statut de la commande
        default: 'en attente'
    },
    dateOrdered: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);
