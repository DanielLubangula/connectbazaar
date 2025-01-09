const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const Vendor = require("../models/Vendor");
const Product = require("../models/product");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const Payment = require('../models/payement');

/**
 * Cette fonction permet aux utilisateurs acheteurs de changer le photo de profil
 */
const multerS3 = require("multer-s3");
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require("../config/aws");

// Configuration de Multer pour S3
const uploadImg = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Nom de votre bucket
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filename = `photoProfilUser/${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.jpg`; // Générer un nom unique
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
}).single("image");

// Fonction de mise à jour de l'image de profil  
exports.uploadImage = async (req, res) => {
  uploadImg(req, res, async function (err) {
    if (err) {
      console.log("Erreur", err);
      return res.status(500).json({
        message: "Erreur lors du téléchargement de l'image",
        error: err,
      });
    }
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Veuillez télécharger une image." });
      }

      const userId = req.session.user._id;

      // Récupérer l'utilisateur depuis la base de données
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // Supprimer l'ancienne image du bucket S3 si elle existe
      if (user.profileImagePath) {
        const oldKey = user.profileImagePath.split('/').slice(-2).join('/'); // Récupérer la clé
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldKey,
          })
        );
      }

      // Mettre à jour le chemin de l'image de profil avec l'URL complète
      user.profileImagePath = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`;

      // Sauvegarder dans la base de données
      await user.save();

      // Mettre à jour la session utilisateur
      req.session.user = user; 

      res.json({
        message: "Image de profil mise à jour avec succès!",
        profileImagePath: user.profileImagePath,
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'image de profil:", err);
      res.status(500).json({
        message:
          "Une erreur est survenue lors de la mise à jour de l'image de profil.",
      });
    }
  });
};

//Fin photo profil user 

// Page de gestion d'inscription des vendeurs 

// Configuration de multer pour sauvegarder l'image dans le dossier uploads/profilVendeur
// Configuration de Multer avec S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Nom de votre bucket
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filename = `profilVendeur/${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${file.originalname}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
}).single('companyLogo');

// Fonction de gestion de l'inscription du vendeur
exports.registerGestion = async (req, res) => {
  let msgErr = '';

  upload(req, res, async (err) => {
    if (err) {
      console.error('Erreur lors de l\'upload de l\'image:', err);
      return res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image.' });
    }

    try {
      const { companyName, companyAddress, phone, email, password, confirmPassword } = req.body;

      // Validation des champs obligatoires
      if (!companyName || !companyAddress || !phone || !email || !password || !confirmPassword) {
        msgErr = 'Tous les champs sont requis.';
        req.session.msgErrorInscVendor = { msgErr, companyName, companyAddress, phone, email };
        return res.status(400).json({ message: msgErr });
      }

      // Vérification de la correspondance des mots de passe
      if (password !== confirmPassword) {
        msgErr = 'Les mots de passe ne correspondent pas.';
        req.session.msgErrorInscVendor = { msgErr, companyName, companyAddress, phone, email };
        return res.status(400).json({ message: msgErr });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingVendor = await Vendor.findOne({ email: email });
      if (existingVendor) {
        msgErr = 'Cet email est déjà utilisé.';
        req.session.msgErrorInscVendor = { msgErr, companyName, companyAddress, phone, email };
        return res.status(400).json({ message: msgErr });
      }

      // Vérification des termes et conditions
      const terms = req.body.terms;
      if (terms !== 'on') {
        msgErr = 'Vous devez accepter les termes et conditions.';
        req.session.msgErrorInscVendor = { msgErr, companyName, companyAddress, phone, email };
        return res.status(400).json({ message: msgErr });
      }

      // Chemin de l'image dans S3
      let profileImagePath = '';
      if (req.file) {
        profileImagePath = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`;
      }

      // Hachage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Création du nouvel utilisateur vendeur
      const vendor = new Vendor({
        companyName,
        companyAddress,
        phone,
        email,
        password: hashedPassword,
        profileImagePath: profileImagePath || null,
      });

      // Sauvegarde dans la base de données
      await vendor.save();

      // Mise à jour de la session
      req.session.vendor = vendor;

      // Réponse de succès
      return res.status(201).json({ message: 'success' });
    } catch (err) {
      console.error('Erreur lors de l\'inscription du vendeur:', err);
      return res.status(500).json({
        message: 'Erreur serveur. Veuillez réessayer plus tard.',
        error: err.message,
      });
    }
  });
};

// Configuration de Multer pour S3
const uploadVendor = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Nom du bucket S3
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filename = `products/${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.jpg`; // Génération d'un nom unique
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo par fichier
}).array("images", 3); // Maximum 3 fichiers

exports.productPublieVendor = async (req, res) => {
  uploadVendor(req, res, async function (err) {
    if (err) {
      console.error("Erreur lors du téléchargement des images:", err);
      return res.status(500).json({
        message: "Erreur lors du téléchargement des images",
        error: err,
      });
    }

    const { name, category, price, description, pickupLocation } = req.body;

    try {
      // Vérifier si le vendeur est authentifié
      let vendor = req.session.vendor;
      if (!vendor) {
        return res.status(403).json({
          message: "Vous devez être connecté pour publier un produit.",
        });
      }

      // Recharger le document Vendor depuis la base de données
      vendor = await Vendor.findById(vendor._id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendeur introuvable." });
      }

      // Vérification de l'état premium
      const paymentStatus = await Payment.findOne({
        email: vendor.email,
        status: "approved",
      });
      const isPremium = !!paymentStatus; // `true` si premium, sinon `false`
      const maxLimit = isPremium ? 15 : 5;

      // Réinitialiser le compteur quotidien si la date a changé
      const today = new Date().toISOString().split("T")[0];
      if (vendor.lastPublicationDate !== today) {
        vendor.publishedTodayCount = 0;
        vendor.lastPublicationDate = today;
      }

      // Vérification de la limite de publication
      if (vendor.publishedTodayCount >= maxLimit) {
        return res.status(403).json({
          message: `Vous avez atteint votre limite quotidienne de publication (${vendor.publishedTodayCount}/${maxLimit}).`,
          limit: "yes",
        });
      }

      // Validation des champs obligatoires
      if (!name || !category || !price || !pickupLocation) {
        return res.status(400).json({
          message: "Veuillez remplir les champs obligatoires.",
        });
      }

      // Vérifier si au moins une image est uploadée
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "Erreur : vous devez télécharger au moins une image.",
        });
      }

      // Limiter à trois images maximum
      if (req.files.length > 3) {
        return res.status(400).json({
          message: "Erreur : vous ne pouvez envoyer que 3 images au maximum.",
        });
      }

      // Créer un tableau des URL des images uploadées
      const images = req.files.map((file) => ({
        path: file.location, // URL complète de l'image sur S3
        contentType: file.mimetype,
      }));

      // Inverser l'ordre des images
      images.reverse();

      // Création du produit
      const product = new Product({
        name,
        category,
        images,
        price,
        description,
        seller: vendor._id,
        pickupLocation, // Ajout du lieu de retrait
      });

      // Sauvegarder le produit dans la base de données
      await product.save();

      // Mettre à jour le compteur du vendeur
      vendor.publishedProductsCount += 1;
      vendor.publishedTodayCount += 1;
      await vendor.save();

      res.json({
        message: "Produit publié avec succès!",
        publishedToday: vendor.publishedTodayCount,
        maxLimit,
        id: product._id,
      });
    } catch (err) {
      console.error("Erreur lors de la publication du produit:", err);
      res.status(500).json({
        message: "Une erreur est survenue lors de la publication du produit.",
        error: err,
      });
    }
  });
};


// Planification de la réinitialisation quotidienne (peut être déplacée ailleurs dans votre application)
cron.schedule("0 0 * * *", async () => {
  try {
    await Vendor.updateMany({}, { $set: { publishedProductsCount: 0 } });
    console.log("Compteurs de publications réinitialisés");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des compteurs : ", error);
  }
});
