const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/product"); // Modèle de produit
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/User");
const Message = require("../models/Message");
// controllers/apiController.js
const Vendor = require("../models/Vendor");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const ProductComment = require("../models/ProductComment");
const Preference = require("../models/Preference");
const likedProduct = require("../models/likeProduct");
const { info } = require("console");
const Payment = require('../models/payement');
const multerS3 = require("multer-s3");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/aws");

// Route API pour supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    // Vérifiez que l'ID est défini et valide
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID de produit invalide" });
    }

    // Recherchez le produit dans la base de données
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    // Supprimez chaque image associée au produit, dans AWS S3 et localement
    const deletePromises = product.images.map(async (image) => {
      // Suppression sur AWS S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Remplacez par votre nom de bucket
        Key: image.s3Key, // Le chemin ou clé dans S3 (doit être stocké dans votre modèle Product)
      };

      try {
        await s3.send(new DeleteObjectCommand(params));
        console.log(`Image supprimée de S3: ${image.s3Key}`);
      } catch (err) {
        console.error("Erreur lors de la suppression de l'image sur S3:", err);
      }

      // Suppression locale si applicable (facultatif)
      const localPath = path.join(__dirname, "..", "uploads", image.path);
      fs.unlink(localPath, (err) => {
        if (err) {
          console.error("Erreur lors de la suppression de l'image locale:", err);
        }
      });
    });

    // Attendez que toutes les suppressions soient terminées
    await Promise.all(deletePromises);

    // Supprimez le produit de la base de données
    await Product.findByIdAndDelete(productId);

    res.json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du produit:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Route API pour supprimer un produit
// exports.deleteProduct = async (req, res) => {
//   try {
//     // Vérifiez que l'ID est défini et valide
//     const productId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({ message: "ID de produit invalide" });
//     }

//     // Recherchez le produit dans la base de données
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Produit non trouvé" });
//     }

//     // Supprimez chaque image associée au produit
//     product.images.forEach((image) => {
//       const imagePath = path.join(__dirname, "..", "uploads", image.path);
//       // Supprimez l'image avec fs.unlink()
//       fs.unlink(imagePath, (err) => {
//         if (err) {
//           console.error("Erreur lors de la suppression de l'image:", err);
//         }
//       });
//     });

//     // Supprimez le produit de la base de données
//     await Product.findByIdAndDelete(productId);

//     res.json({ message: "Produit supprimé avec succès" });
//   } catch (error) {
//     console.error("Erreur lors de la suppression du produit:", error);
//     res.status(500).json({ message: "Erreur serveur" });
//   }
// };
// //

// Configuration de multer pour stocker les images en mémoire
const storageVendor = multer.memoryStorage();
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
      )}${path.extname(file.originalname)}`; // Génération d'un nom unique
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Taille limite de 5 Mo par fichier
}).array("images", 3); // Maximum 3 fichiers

// Fonction pour la modification du produit
exports.editProduct = async (req, res) => {
  uploadVendor(req, res, async function (err) {
    if (err) {
      console.error("Erreur lors du téléchargement des images:", err);
      return res.status(500).json({
        message: "Erreur lors du téléchargement des images",
        error: err,
      });
    }

    const { name, category, price, description, pickupLocation } = req.body;
    const productId = req.params.id;
    let msgErr = "";

    // Validation des champs obligatoires
    if (!name || !category || !price) {
      msgErr = "Veuillez remplir les champs obligatoires";
      return res.status(400).json({ message: msgErr });
    }

    try {
      // Récupérer le produit actuel pour obtenir les chemins des images actuelles
      const currentProduct = await Product.findById(productId);
      if (!currentProduct) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }

      // Vérifier si de nouvelles images ont été uploadées
      let images = currentProduct.images; // Conserver les images actuelles par défaut
      if (req.files && req.files.length > 0) {
        // Supprimer les anciennes images du bucket S3 si de nouvelles images sont uploadées
        if (images && images.length > 0) {
          for (const image of images) {
            const imageKey = image.path.split("/").slice(3).join("/"); // Extraire la clé du fichier S3
            try {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: imageKey,
                })
              );
              console.log(`Image supprimée du bucket S3: ${imageKey}`);
            } catch (error) {
              console.error(`Erreur lors de la suppression de l'image S3: ${imageKey}`, error);
            }
          }
        }

        // Créer un tableau des URL des images uploadées
        images = req.files.map((file) => ({
          path: file.location, // URL complète de l'image sur S3
          contentType: file.mimetype,
        }));

        // Inverser l'ordre des images pour les sauvegarder
        images.reverse();
      }

      // Mise à jour du produit dans la base de données
      const updateData = { name, category, price, description, pickupLocation };
      if (images.length > 0) {
        updateData.images = images; // Mettre à jour les chemins d'accès des images si de nouvelles images sont fournies
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true }
      );

      res.json({
        message: "Produit mis à jour avec succès",
        product: updatedProduct,
      });
    } catch (err) {
      console.error("Erreur lors de la modification du produit:", err);
      msgErr = "Une erreur est survenue lors de la modification du produit";
      res.status(500).json({ message: msgErr });
    }
  });
};


exports.infiniteScrollProduct = async (req, res) => {
  try {
    const lastProductId = req.params.id; // ID du dernier produit visible

    // Récupérer les produits du vendeur ayant un `_id` inférieur à `lastProductId`
    const products = await Product.find({
      seller: req.session.vendor._id,
      _id: { $lt: lastProductId }, // Filtrer pour récupérer les produits avec un ID inférieur
    })
      .sort({ _id: -1 }) // Trier par `_id` décroissant (du plus récent au plus ancien)
      .limit(10); // Limiter le nombre de produits pour chaque chargement

    res.json({ products }); 
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Contrôleur pour mettre à jour les informations du vendeur
exports.updateVendorInfo = async (req, res) => {
  console.log("arrivé : " + req.body);
  console.log(req.body);
  // Valider les champs du formulaire
  await body("companyName").optional().isString().run(req);
  await body("companyAddress").optional().isString().run(req);
  await body("email").optional().isEmail().run(req);
  await body("phone").optional().isString().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { companyName, companyAddress, email, phone } = req.body;
    const vendorId = req.session.vendor._id; // ID du vendeur actuellement connecté

    // Rechercher le vendeur par ID
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendeur non trouvé" });
    }

    // Mettre à jour uniquement les champs fournis
    if (companyName) vendor.companyName = companyName;
    if (companyAddress) vendor.companyAddress = companyAddress;
    if (email) vendor.email = email;
    if (phone) vendor.phone = phone;

    // Sauvegarder les changements
    await vendor.save();
    req.session.vendor = vendor;
    res.json({ message: "Informations mises à jour avec succès", vendor });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des informations du vendeur:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// Configuration de Multer pour S3
const uploadVendorImg = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Nom du bucket S3
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filename = `profilVendor/${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.jpg`; // Génération d'un nom unique
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
}).single("profilVendor");

// Fonction de mise à jour de l'image de profil
exports.updateProfileImage = async (req, res) => {
  uploadVendorImg(req, res, async function (err) {
    if (err) {
      console.error("Erreur lors du téléchargement de l'image:", err);
      return res.status(500).json({
        message: "Erreur lors du téléchargement de l'image",
        error: err,
      });
    }

    try {
      // Vérifier si un fichier a été téléchargé
      if (!req.file) {
        return res.status(400).json({ message: "Veuillez télécharger une image." });
      }

      const vendorId = req.session.vendor._id;

      // Récupérer le vendeur depuis la base de données
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendeur non trouvé." });
      }

      // Supprimer l'ancienne image de S3 si elle existe
      if (vendor.profileImagePath) {
        const oldKey = vendor.profileImagePath.split("/").slice(-2).join("/"); // Extraire la clé de l'ancienne image
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldKey,
          })
        );
      }

      // Mettre à jour le chemin de l'image de profil avec l'URL complète
      vendor.profileImagePath = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`;

      // Sauvegarder les modifications dans la base de données
      await vendor.save();

      // Mettre à jour la session utilisateur
      req.session.vendor = vendor;

      res.json({
        message: "Image de profil mise à jour avec succès!",
        profileImagePath: vendor.profileImagePath,
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'image de profil:", err);
      res.status(500).json({
        message: "Une erreur est survenue lors de la mise à jour de l'image de profil.",
      });
    }
  });
}; 


exports.updatePassword = async (req, res) => {
  // Valider les champs de mot de passe
  await body("password")
    .isLength({ min: 3 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères.")
    .run(req);
  await body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Les mots de passe ne correspondent pas.");
      }
      return true;
    })
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const vendorId = req.session.vendor._id; // ID du vendeur actuellement connecté
    const { password } = req.body;

    // Récupérer le vendeur connecté
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendeur non trouvé" });
    }

    const isMatch = await bcrypt.compare(req.body.passwordOld, vendor.password); // user.password est le mot de passe haché dans la DB
    if (!isMatch) {
      req.session.messsageErrorUpdatepassword =
        "Mot de passe actuel incorrect.";

      return res
        .status(400)
        .json({ message: " Mot de passe actuel incorrect." });
    }

    // Hachage du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Mise à jour du mot de passe
    vendor.password = hashedPassword;
    await vendor.save();

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les préférences d'un vendeur
exports.preferencVendor = async (req, res) => {
  try {
    const preferences = await Preference.findOne({
      vendorId: req.session.vendor._id,
    });
    if (!preferences) {
      const newPreference = await Preference({
        vendorId: req.session.vendor._id,
        emailNotifications: true,
        smsNotifications: false,
      });
      await newPreference.save();
      return res.status(200).json({ message: newPreference });
    }
    res.json(preferences);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour les préférences d'un vendeur
exports.updatePreference = async (req, res) => {
  const { emailNotifications, smsNotifications } = req.body;
  try {
    let preferences = await Preference.findOne({
      vendorId: req.session.vendor._id,
    });

    if (emailNotifications) {
      preferences.emailNotifications = !preferences.emailNotifications;
    }

    if (smsNotifications) {
      preferences.smsNotifications = !preferences.smsNotifications;
    }

    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.log("Erreur lors de update de préférence " + error);
    res.status(500).json({ message: error.message });
  }
};

// Fonction pour récupérer trois produits de chaque catégorie spécifiée
// Fonction pour récupérer trois produits de chaque catégorie spécifiée avec les informations du vendeur
// Fonction pour récupérer trois produits par catégorie avec priorité pour les vendeurs premium
// Fonction pour récupérer trois produits par catégorie avec priorité pour les vendeurs premium
exports.allCatalogue = async (req, res) => {
  try {
    const premiumVendors = await Payment.find({ status: "approved" }, "email").lean();
    const premiumEmails = premiumVendors.map((vendor) => vendor.email);

    const categories = await Product.aggregate([
      {
        $match: {
          category: { $in: ["Électronique", "Vêtements", "Alimentation", "Autres"] },
        },
      },
      {
        $lookup: {
          from: "vendors",
          localField: "seller",
          foreignField: "_id",
          as: "vendorInfo",
        },
      },
      {
        $unwind: "$vendorInfo",
      },
      {
        $addFields: {
          isPremium: { $in: ["$vendorInfo.email", premiumEmails] },
        },
      },
      {
        $sort: {
          isPremium: -1, // Priorité aux produits premium
          dateAdded: -1, // Trier par date décroissante
        },
      },
      {
        $group: {
          _id: "$category",
          premiumProducts: {
            $push: {
              $cond: [
                { $eq: ["$isPremium", true] },
                {
                  name: "$name",
                  id: "$_id",
                  category: "$category",
                  price: "$price",
                  description: "$description",
                  pickupLocation: "$pickupLocation",
                  images: "$images",
                  seller: {
                    _id: "$seller",
                    name: "$vendorInfo.companyName",
                    profileImagePath: "$vendorInfo.profileImagePath",
                  },
                  isPremium: "$isPremium",
                  dateAdded: "$dateAdded",
                },
                null,
              ],
            },
          },
          regularProducts: {
            $push: {
              $cond: [
                { $eq: ["$isPremium", false] },
                {
                  name: "$name",
                  id: "$_id",
                  category: "$category",
                  price: "$price",
                  description: "$description",
                  pickupLocation: "$pickupLocation",
                  images: "$images",
                  seller: {
                    _id: "$seller",
                    name: "$vendorInfo.companyName",
                    profileImagePath: "$vendorInfo.profileImagePath",
                  },
                  isPremium: "$isPremium",
                  dateAdded: "$dateAdded",
                },
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          premiumProducts: {
            $filter: {
              input: "$premiumProducts",
              as: "product",
              cond: { $ne: ["$$product", null] },
            },
          },
          regularProducts: {
            $filter: {
              input: "$regularProducts",
              as: "product",
              cond: { $ne: ["$$product", null] },
            },
          },
        },
      },
      {
        $project: {
          category: 1,
          products: {
            $concatArrays: [
              { $slice: ["$premiumProducts", 3] }, // Trois premiers produits premium
              {
                $slice: [
                  {
                    $filter: {
                      input: "$regularProducts",
                      as: "product",
                      cond: {
                        $and: [
                          { $ne: ["$$product", null] },
                          { $gte: [3, { $size: "$premiumProducts" }] }, // Seulement si moins de 3 premium
                        ],
                      },
                    },
                  },
                  { $subtract: [3, { $size: "$premiumProducts" }] }, // Compléter jusqu'à 3 si nécessaire
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          categoryOrder: {
            $cond: {
              if: { $eq: ["$category", "Autres"] },
              then: 1, // Donner une priorité basse à "Autres"
              else: 0, // Autres catégories avant
            },
          },
        },
      },
      {
        $sort: {
          categoryOrder: 1, // Trier selon l'ordre des catégories
        },
      },
    ]);

    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération du catalogue :", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération du catalogue.",
    });
  }
};


exports.numberComment = async (req, res) => {
  const { id } = req.body;
  const comment = await ProductComment.find({
    productId: id,
    parentCommentId: null,
  });

  const commentObjet = {
    comment: comment.length,
    id: req.body,
  };

  res.json({ commentObjet });
};

// Fonction pour recupérer les informations de l'utilisateur
exports.userinfo = async (req, res) => {
  // variable pour contenir les informations de l'utilisateur
  let infoUser = "";

  //récupérationde l'id
  const { id } = req.body;

  // Rechercher l'id dans le modèle user (acheteur)
  infoUser = await User.findById(id);

  // Rechercher l'id dans le modèle Vendor (vendeur)
  if (infoUser === null) {
    infoUser = await Vendor.findById(id).select("--password");
  }

  res.json({ infoUser: infoUser });
};

// Supprimer un commentaire (remplacement par un message de suppression)
exports.commentDelete = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Vérifiez si un utilisateur ou un vendeur est connecté
    const userId = req.session.user ? req.session.user._id : null;
    const vendorId = req.session.vendor ? req.session.vendor._id : null;

    if (!userId && !vendorId) {
      return res.status(403).json({
        message: "Vous devez être connecté pour effectuer cette action.",
      });
    }

    // Rechercher le commentaire
    const comment = await ProductComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Commentaire introuvable." });
    }

    // Vérifiez si l'utilisateur ou le vendeur correspond à l'auteur du commentaire
    if (comment.userId.toString() !== (userId || vendorId)) {
      return res.status(403).json({
        message: "Vous n'avez pas la permission de supprimer ce commentaire.",
      });
    }

    // Mettre à jour le commentaire pour indiquer qu'il a été supprimé
    console.log("comment", comment)
    comment.comment = "Ce commentaire a été supprimé.";
    comment.isDeleted = true;
    comment.deletedAt = new Date(); // Enregistrer la date de suppression (optionnel)
    await comment.save();

    return res.status(200).json({ message: "ok" });
  } catch (error) {
    console.error("Erreur lors de la suppression du commentaire :", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// // Supprimer un commentaire
// exports.commentDelete = async (req, res) => {
//   try {
//     const { commentId } = req.params;

//     // Vérifiez si un utilisateur ou un vendeur est connecté
//     const userId = req.session.user ? req.session.user._id : null;
//     const vendorId = req.session.vendor ? req.session.vendor._id : null;

//     if (!userId && !vendorId) {
//       return res.status(403).json({
//         message: "Vous devez être connecté pour effectuer cette action.",
//       });
//     }

//     // Rechercher le commentaire
//     const comment = await ProductComment.findById(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Commentaire introuvable." });
//     }

//     // Vérifiez si l'utilisateur ou le vendeur correspond à l'auteur du commentaire
//     if (comment.userId.toString() !== (userId || vendorId)) {
//       return res.status(403).json({
//         message: "Vous n'avez pas la permission de supprimer ce commentaire.",
//       });
//     }

//     // Supprimer le commentaire
//     await ProductComment.findByIdAndDelete(commentId);

//     return res
//       .status(200)
//       .json({ message: "Commentaire supprimé avec succès." });
//   } catch (error) {
//     console.error("Erreur lors de la suppression du commentaire :", error);
//     return res.status(500).json({ message: "Erreur interne du serveur." });
//   }
// };

// Route API pour obtenir les produits du vendeur
exports.apiProductDetail = async (req, res) => {
  const { categoryDetail, page = 1 } = req.body; // Récupère la catégorie et la page depuis la requête
const ITEMS_PER_PAGE = 12; // Nombre de produits par page

  try {
    // Récupérer les emails des vendeurs premium
    const premiumVendors = await Payment.find({ status: "approved" }, "email").lean();
    const premiumEmails = premiumVendors.map((vendor) => vendor.email);

    let filter = {};

    // Vérification et normalisation de la catégorie
    if (categoryDetail && categoryDetail !== "all") {
      const categoriesMap = {
        électronique: "Électronique",
        alimentation: "Alimentation",
        vêtements: "Vêtements",
        autres : 'Autres'
      };
      filter.category = categoriesMap[categoryDetail.toLowerCase()] || categoryDetail;
    }

    // Étape 1 : Ajouter les informations premium aux produits
    const products = await Product.aggregate([
      { $match: filter }, // Filtrer les produits par catégorie
      {
        $lookup: {
          from: "vendors", // Associer les produits avec les informations vendeur
          localField: "seller",
          foreignField: "_id",
          as: "vendorInfo",
        },
      },
      { $unwind: "$vendorInfo" }, // Transformer le tableau vendorInfo en objet
      {
        $addFields: {
          isPremium: { $in: ["$vendorInfo.email", premiumEmails] }, // Ajouter le statut premium
        },
      },
      { $sort: { isPremium: -1, dateAdded: -1 } }, // Priorité aux produits premium et tri par date décroissante
      {
        $facet: {
          paginatedResults: [
            { $skip: (page - 1) * ITEMS_PER_PAGE }, // Produits à ignorer pour atteindre la page
            { $limit: ITEMS_PER_PAGE }, // Nombre de produits par page
          ],
          totalCount: [{ $count: "count" }], // Compte total des produits pour cette catégorie
        },
      },
    ]);

    // Récupérer les produits paginés et le total des produits
    const enrichedProducts = products[0]?.paginatedResults || [];
    const totalProducts = products[0]?.totalCount[0]?.count || 0;

    // Étape 2 : Enrichir les produits avec les informations utilisateur/vendeur
    const finalProducts = await Promise.all(
      enrichedProducts.map(async (product) => {
        const user =
          (await User.findById(product.seller)) ||
          (await Vendor.findById(product.seller));
        if (user) {
          product.infoUser = {
            userId: product.seller,
            username: user.username || user.companyName,
            profileImagePath: user.profileImagePath,
          };
        }
        return product;
      })
    );

    // Calculer s'il y a encore d'autres produits
    const hasMore = page * ITEMS_PER_PAGE < totalProducts;

    // Retourner la réponse au client
    res.json({
      products: finalProducts,
      hasMore,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / ITEMS_PER_PAGE), // Calcul total de pages
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// Configuration de Multer pour S3
const uploadMessageImg = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Nom du bucket S3
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filename = `messages/${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.jpg`; // Génération d'un nom unique
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo par fichier
}).array("images", 5); // Limite de 5 fichiers

// Fonction pour recevoir les messages et fichiers
exports.uploadChat = async (req, res) => {
  uploadMessageImg(req, res, async function (err) {
    if (err) {
      console.error("Erreur lors du téléchargement des images:", err);
      return res.status(500).json({
        message: "Erreur lors du téléchargement des images.",
        error: err,
      });
    }

    try {
      // Vérifier si un message texte ou des images sont présents
      const { message, recipient } = req.body;
      if (!message && (!req.files || req.files.length === 0)) {
        return res
          .status(400)
          .json({ message: "Veuillez envoyer un message ou au moins une image." });
      }

      const userId = req.session.user?._id || req.session.vendor?._id;

      // Vérifier si l'utilisateur est valide
      const user =
        (await User.findById(userId)) || (await Vendor.findById(userId));
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // Créer un tableau contenant les URL des images
      const images = req.files.map((file) => ({
        path: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`,
        contentType: file.mimetype,
      }));

      // Créer un objet message
      const savedMessage = new Message({
        sender: userId,
        recipient,
        content: message || null,
        images,
        timestamp: new Date(),
      });

      // Sauvegarder le message dans la base de données
      await savedMessage.save();

      res.json({
        message: "Message et images reçus avec succès !",
        data: savedMessage,
      });
    } catch (err) {
      console.error("Erreur lors du traitement des données:", err);
      res.status(500).json({
        message: "Une erreur est survenue lors du traitement des données.",
      });
    }
  });
};



exports.recuperChat = async (req, res) => {
  // Endpoint pour récupérer les messages
  try {
    const senderId = req.session.user?._id || req.session?.vendor?._id;
    const { productId, recipientId } = req.body;

    // Validation des paramètres
    if (!productId || !senderId || !recipientId) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Rechercher les messages liés dans la base de données
    const messages = await Message.find({
      productId,
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    }).sort({ timestamp: 1 }); // Trie par ordre chronologique

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.numbreNotifListChat = async (req, res) => {
  const currentUserId = req.session.user?._id || req.session.vendor?._id;

  if (!currentUserId) return;

  const { sender, productId } = req.body;
  try {
    const allNotif = await Message.find({
      sender: sender, // Expéditeur des messages
      recipient: currentUserId, // Destinataire (l'utilisateur connecté)
      productId: productId, // Produit concerné
      unread: true, // Seulement les messages non lus
    });

    res.json({
      nombreNotif: allNotif.length,
      identif: {
        sender,
        productId,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération de notification", err);
  }
};

exports.listNoir = async (req, res) => {
  try {
    const userId = req.session.user?._id || req.session.vendor?._id;
    const { otherUser } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!otherUser) {
      return res
        .status(400)
        .json({ error: "ID de l'utilisateur à bloquer manquant" });
    }

    // Trouver l'utilisateur connecté
    const findUserSession =
      (await User.findById(userId)) || (await Vendor.findById(userId));

    if (!findUserSession) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier si `otherUser` est déjà dans `listNoir`
    const index = findUserSession.listNoir.findIndex(
      (idUser) => idUser.userId.toString() === otherUser
    );

    if (index !== -1) {
      // Supprimer l'utilisateur de la liste noire
      findUserSession.listNoir.splice(index, 1);
    } else {
      // Ajouter l'utilisateur à la liste noire
      findUserSession.listNoir.push({ userId: otherUser });
    }

    // Sauvegarder les changements
    await findUserSession.save();

    return res.status(200).json({
      message:
        index !== -1
          ? "Utilisateur retiré de la liste noire"
          : "Utilisateur ajouté à la liste noire",
    });
  } catch (error) {
    console.error("Erreur dans listNoir:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * API pour "supprimer" un commentaire en le marquant comme supprimé.
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 */
exports.deleteMessage = async (req, res) => {
  const currentUserId = req.session.user?._id || req.session.vendor?._id; // Utilisateur actuel
  const { messageId } = req.body; // ID du message à supprimer

  // Vérifier si toutes les données nécessaires sont présentes
  if (!currentUserId || !messageId) {
    return res.status(400).json({
      success: false,
      error: "Données manquantes. Assurez-vous d'envoyer messageId.",
    });
  }

  try {
    // Trouver le message par ID
    const message = await Message.findById(messageId);

    // Vérifier si le message existe
    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message introuvable.",
      });
    }

    // Vérifier si l'utilisateur est soit l'expéditeur soit le destinataire

    if (
      message.sender.toString() !== currentUserId 
    ) {
      return res.status(403).json({
        success: false,
        error: "Vous n'avez pas la permission de supprimer ce commentaire.",
      });
    }

    if (message.isDelete){
      return res.status(403).json({
        success: false,
        error: "Ce message est déjà supprimé",
      });
    }

    console.log('Attente avant de passé')
    // Mettre à jour le contenu pour indiquer qu'il a été supprimé
    message.content = "Ce commentaire a été supprimé.";
    message.images = []; // Supprimer les images associées
    message.audios = []; // Supprimer les audios associés
    message.isDelete = true
    await message.save();

    // Répondre avec succès
    return res.status(200).json({
      success: true,
      message: "Commentaire supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du commentaire :", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression du commentaire.",
    });
  }
};



exports.allContries =  async (req, res) => {
  return
  try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      const countries = await response.json();
      res.json(countries);
  } catch (error) {
      console.error("Erreur lors de la récupération des pays :", error);
      res.status(500).send("Erreur interne du serveur");
  }
};


// exports.apiProductDetail = async (req, res) => {
//   // const sessionUser = req.session.user || req.session.vendor
//   let categoryDetail = req.body.categoryDetail;
//   console.log(categoryDetail);

//   let userId, username, profileImagePath, products;

//   if (categoryDetail == "électronique") {
//     categoryDetail = "Électronique";
//   }
//   if (categoryDetail == "alimentation") {
//     categoryDetail = "Alimentation";
//   }
//   if (categoryDetail == "vêtements") {
//     categoryDetail = "Vêtements";
//   }

//   try {

//     if (categoryDetail == "all"){
//         // Récupérer les produits et les trier par `dateAdded` (les plus récents en premier)
//         products = await Product.find({})
//           .sort({ dateAdded: -1 })
//           .limit(10); // -1 pour ordre décroissant

//         }else{
//         // Récupérer les produits et les trier par `dateAdded` (les plus récents en premier)
//         products = await Product.find({
//           category: categoryDetail,
//         })
//           .sort({ dateAdded: -1 })
//           .limit(5); // -1 pour ordre décroissant

//       }

//     products = await Promise.all(
//       products.map(async (product) => {
//         userId = product.seller;
//         const userIdent = await User.findById(userId);
//         if (userIdent) {
//           username = userIdent.username;
//           profileImagePath = userIdent.profileImagePath;
//         } else {
//           const vendorIdent = await Vendor.findById(userId);
//           username = vendorIdent.companyName;
//           profileImagePath = vendorIdent.profileImagePath;
//         }

//         product.infoUser = { userId, username, profileImagePath };

//         return product;
//       })
//     );

//     res.json(products);
//   } catch (error) {
//     console.error("Erreur lors de la récupération des produits:", error);
//     res.status(500).json({ message: "Erreur serveur" });
//   }
// };
