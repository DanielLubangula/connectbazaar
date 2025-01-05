const mongoose = require('mongoose');
require('dotenv').config();


// Charger l'URI de MongoDB depuis .env
const mongoURI = process.env.MONGO_URI

// Fonction de connexion à MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connecté');
    } catch (err) {
        console.error('Erreur de connexion à MongoDB', err);
        process.exit(1);  // Quitter l'application en cas d'échec de la connexion
    }
};

module.exports = { connect: connectDB };


// const mongoose = require('mongoose');

// // Fonction de connexion à MongoDB
// const connectDB = async () => {
//     try {
//         await mongoose.connect('mongodb://localhost/site-vente');
//         console.log('MongoDB connecté');
//     } catch (err) {
//         console.error('Erreur de connexion à MongoDB', err);
//         process.exit(1);  // Quitter l'application en cas d'échec de la connexion
//     }
// };

// module.exports = { connect: connectDB };
