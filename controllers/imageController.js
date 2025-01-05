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

// Configurer multer pour stocker l'image en mémoire
const storageVendorImg = multer.memoryStorage();
const uploadImg = multer({
  storage: storageVendorImg,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limiter la taille à 5 Mo
}).single("image"); // Un seul fichier à la fois pour l'image de profil

// Chemin du dossier de sauvegarde des images de profil
const uploadDirImg = path.join(__dirname, "..", "uploads", "photoProfilUser");

// Fonction de mise à jour de l'image de profil
exports.uploadImage = async (req, res) => {
  // Utiliser multer pour gérer le téléchargement de l'image
  uploadImg(req, res, async function (err) {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors du téléchargement de l'image",
        error: err,
      });
    }

    try {
      // Vérifier si un fichier a été téléchargé
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Veuillez télécharger une image." });
      }

      const userId = req.session.user._id;

      // Récupérer le vendeur depuis la base de données
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Acheteur non trouvé." });
      }

      // Supprimer l'ancienne image du serveur de fichiers si elle existe
      if (user.profileImagePath) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "uploads",
          user.profileImagePath
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Traiter et sauvegarder la nouvelle image avec Sharp
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const filePath = path.join(uploadDirImg, filename);

      // Compression et redimensionnement de l'image
      const processedImageBuffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 }) // Ajuster la taille selon les besoins
        .jpeg({ quality: 80 }) // Compression en JPEG avec qualité 80
        .toBuffer();

      // Sauvegarder l'image traitée sur le serveur
      fs.writeFileSync(filePath, processedImageBuffer);

      // Mettre à jour le chemin de l'image de profil dans la base de données
      user.profileImagePath = `/photoProfilUser/${filename}`;
      await user.save();

      req.session.user = user;
      res.json({
        message: "Image de profil mise à jour avec succès!",
        profileImagePath: user.profileImagePath, // Nouveau chemin de l'image
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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const finalUploadPath = path.join(__dirname, "../uploads/profilVendeur");

    // Créer le dossier de destination s'il n'existe pas
    if (!fs.existsSync(finalUploadPath)) {
      fs.mkdirSync(finalUploadPath, { recursive: true });
    }
    cb(null, finalUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("companyLogo");

exports.registerGestion = async (req, res) => {
  let msgErr = "";

  // Vérification de l'utilisateur non connecté

  upload(req, res, async (err) => {
    if (err) {
      console.error("Erreur lors de l'upload de l'image :", err);
      return res.status(500).json({ message: "Erreur d'upload de l'image." });
    }

    try {
      const {
        companyName,
        companyAddress,
        phone,
        email,
        password,
        confirmPassword,
      } = req.body;

      // Validation des champs obligatoires
      if (
        !companyName ||
        !companyAddress ||
        !phone ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        msgErr = "Tous les champs sont requis.";
        req.session.msgErrorInscVendor = {
          msgErr,
          companyName,
          companyAddress,
          phone,
          email,
          password,
          confirmPassword,
        };
        return res.status(400).json({message : msgErr});
      }

      // Vérification de la correspondance des mots de passe
      if (password !== confirmPassword) {
        msgErr = "Les mots de passe ne correspondent pas.";
        req.session.msgErrorInscVendor = {
          msgErr,
          companyName,
          companyAddress,
          phone,
          email,
          password,
          confirmPassword,
        };
        return res.status(400).json({message : msgErr});
      }

      // Vérifier si l'utilisateur existe déjà
      const existingVendor = await Vendor.findOne({ email: email });
      if (existingVendor) {
        msgErr = "Cet email est déjà utilisé.";
        req.session.msgErrorInscVendor = {
          msgErr,
          companyName,
          companyAddress,
          phone,
          email,
          password,
          confirmPassword,
        };
        return res.status(400).json({message : msgErr});
      }

      // Vérification des termes et conditions
      const terms = req.body.terms;
      if (terms !== "on") {
        msgErr =
          "Si vous accepter nos conditions générales d'utilisation et la politique de confidentialité, veillez cocher s'il vous plaît";
        req.session.msgErrorInscVendor = {
          msgErr,
          companyName,
          companyAddress,
          phone,
          email,
          password,
          confirmPassword,
        };
        return res.status(400).json(msgErr);
      }

      // Chemin de l'image
      let profileImagePath = "";
      if (req.file) {
        profileImagePath = `/profilVendeur/${req.file.filename}`;
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
      // Sauvegarde du vendeur dans la base de données
      await vendor.save();

      // Mise à jour de la session
      req.session.vendor = vendor;

      // Réponse de succès
      return res.status(201).json({message : "success"});
    } catch (err) {
      // Gestion des erreurs
      console.error("Erreur lors de l'inscription du vendeur :", err);
      return res.status(500).json({
        message: "Erreur serveur. Veuillez réessayer plus tard.",
        error: err.message,
      });
    }
  });
};

const storageVendor = multer.memoryStorage();
const uploadVendor = multer({
  storage: storageVendor,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limiter la taille à 5 Mo par fichier
}).array("images", 3); // Maximum 3 fichiers

const uploadDir = path.join(__dirname, "..", "uploads", "products");

exports.productPublieVendor = async (req, res) => {
  uploadVendor(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ message: "Erreur lors du téléchargement", error: err });
    }

    const { name, category, price, description, pickupLocation } = req.body;

    try {
      // Vérifier si le vendeur est authentifié
      let vendor = req.session.vendor;
      if (!vendor) {
        return res.status(403).json({ message: "Vous devez être connecté pour publier un produit." });
      }

      // Recharger le document Vendor depuis la base de données
      vendor = await Vendor.findById(vendor._id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendeur introuvable." });
      }

      // Vérification de l'état premium
      const paymentStatus = await Payment.findOne({ email: vendor.email, status: "approved" });
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
          limit: "yes"
        });
      }

      // Validation des champs obligatoires
      if (!name || !category || !price || !pickupLocation) {
        return res.status(400).json({ message: "Veuillez remplir les champs obligatoires." });
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

      // Créer un tableau de chemins d'accès aux images traitées
      const images = await Promise.all(
        req.files.map(async (file, index) => {
          const processedImageBuffer = await sharp(file.buffer)
            .resize({ width: 320, height: 280 }) // Redimensionnement
            .jpeg({ quality: 99 }) // Compression JPEG
            .toBuffer();

          const filename = `image_${Date.now()}_${index}.jpg`;
          const filePath = path.join(uploadDir, filename);

          // Sauvegarder l'image
          fs.writeFileSync(filePath, processedImageBuffer);

          return {
            path: "/products/" + filename, // Chemin relatif de l'image
            contentType: "image/jpeg",
          };
        })
      );

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
        id: product._id
      });
    } catch (err) {
      console.error("Erreur lors de la publication du produit:", err);
      res.status(500).json({ message: "Une erreur est survenue lors de la publication du produit." });
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
