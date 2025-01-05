const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const initAdmin = async () => {

  try {
    const email = process.env.EMAIL; // Email par défaut
    const password = process.env.PASSWORDADMIN; // Mot de passe par défaut

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin déjà existant');
      return;
    }

    const admin = new Admin({ email, password });
    await admin.save();

console.log('Administrateur initialisé avec succès');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de l\'admin:', err);
  } finally {
    mongoose.connection.close();
  }
};

module.exports = initAdmin