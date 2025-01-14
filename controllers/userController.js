const User = require("../models/User");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const Vendor = require("../models/Vendor"); // Assurez-vous d'inclure votre modèle Vendor
const Message = require("../models/Message");
const Product = require("../models/product"); //
const Payment = require("../models/payement");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();
const URL = "localhost";

// Page d'acceuil
exports.acceuil = async (req, res) => {
  const tabId = req.cookies?.tabId; // Utilisation de l'opérateur optionnel pour vérifier si cookies existe
  let userId = req.session.user?._id || req.session.vendor?._id;
  let chatMessage = "";
  let CheckStatus = "";

  // Rechercher le status de payement
  if (req.session.vendor) {
    let userEmail = req.session.vendor.email;
    let isPayement = await Payment.findOne({
      email: userEmail,
    });

    if (isPayement) CheckStatus = isPayement.status;
  }

  // Rechercher si l'utilisateur connecté à un message
  let isMessage = await Message.find({
    $or: [{ sender: userId }, { recipient: userId }],
  });

  const allNotif = await Message.find({
    recipient: userId, // Destinataire (l'utilisateur connecté)
    unread: true, // Seulement les messages non lus
  });

  let p = "";
  if (allNotif.length > 0) {
    p = allNotif.length;
  } else {
    p = "";
  }

  const user = req.session.user;
  const vendor = req.session.vendor;
  const navbarFooter = true;

  res.render("acceuil", {
    user,
    vendor,
    isMessage,
    p,
    CheckStatus,
    URL,
    navbarFooter,
  });
};

// api pour récuperer le nombre des utilisateurs
exports.numberNotifMessage = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "L'ID utilisateur est requis" });
    }

    const allNotif = await Message.find({
      recipient: userId, // Destinataire (l'utilisateur connecté)
      unread: true, // Seulement les messages non lus
    });

    const notificationCount = allNotif.length;
    res.json({ notifications: notificationCount });
  } catch (error) {
    console.error("Erreur dans numberNotifMessage:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Route pour la page registerLogin
let messageError = "";
exports.registerLogin = (req, res) => {
  if (req.session.messageError) {
    messageError = req.session.messageError;
  } else {
    messageError = "Pas d'erreur";
  }
  res.render("registerLogin", { messageError, URL });
};

exports.registerUser = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Vérification des champs
  if (!username || !email || !password || !confirmPassword) {
    return res
      .status(401)
      .json({ errors: "Veuillez remplir tous les champs." });
  }

  if (password !== confirmPassword) {
    return res
      .status(401)
      .json({ errors: "Les mots de passe ne correspondent pas." });
  }

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({ errors: "Email déjà enregistré." });
    }

    // Création d'un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();

    // Ajouter l'utilisateur dans la session si nécessaire
    req.session.user = newUser;

    res.status(201).json({ message: "Inscription réussie !" });
  } catch (err) {
    console.error("Erreur lors de l'inscription :", err);
    res.status(500).json({ errors: "Une erreur interne s'est produite." });
  }
};

// Page mot de passe oublié
exports.forgotPasswordPage = (req, res) => {
  res.render("forgotPassword", URL);
};

// Page mot de passe oublié
exports.forgotPasswordPage = (req, res) => {
  res.render("forgotPassword", URL);
};

// Connexion de l'utilisateur
exports.loginUser = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Vérifier si les champs sont remplis
  if (!email || !password) {
    return res
      .status(400)
      .json({ errors: "Veuillez entrer votre email et mot de passe." });
  }

  try {
    // Vérifier si l'utilisateur existe dans la base de données
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ errors: "Email ou mot de passe incorrect." });
    }

    // Comparer le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ errors: "Email ou mot de passe incorrect." });
    }

    // Vérifier si l'utilisateur est bloqué
    if (user.status === "blocked") {
      return res
        .status(403)
        .json({
          errors:
            "Votre compte est bloqué. Veuillez contacter l'administrateur.",
        });
    }

    // Si "Se souvenir de moi" est coché, on prolonge la durée de vie de la session
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    } else {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 heure
    }

    // Enregistrer l'utilisateur dans la session
    req.session.user = user;

    // Réponse de succès
    res.status(200).json({ message: "Connexion réussie !" });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ errors: "Une erreur interne s'est produite." });
  }
};

// Endpoint pour envoyer le lien de réinitialisation
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ errors: "Aucun compte trouvé avec cet email." });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 heure

    // Enregistrer le token et sa date d'expiration
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Créer le lien de réinitialisation
    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;

    // Configuration du transporteur pour Outlook
    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587, // Port recommandé pour Outlook
      secure: false, // TLS activé (false pour non sécurisé)
      auth: {
        user: process.env.EMAIL_USER, // Utilisez les variables d'environnement pour sécuriser vos informations
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: "SSLv3", // Assurez une compatibilité SSL/TLS
      },
    });

    // Définir les options de l'email
    const mailOptions = {
      from: '"Support" <support@votre-site.com>', // Remplacez par votre adresse email
      to: email, // Email de l'utilisateur
      subject: "Réinitialisation de votre mot de passe",
      text: `Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe. Veuillez utiliser le lien ci-dessous :\n\n${resetLink}\n\nCe lien expirera dans une heure.\n\nSi vous n'avez pas demandé cela, ignorez cet email.\n\nCordialement,\nL'équipe Support.`,
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Lien de réinitialisation envoyé avec succès." });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error
    );
    res.status(500).json({ errors: "Une erreur interne s'est produite." });
  }
};

// Endpoint pour définir un nouveau mot de passe
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Vérifier si le token est valide
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }, // Vérifier que le token n'a pas expiré
    });

    if (!user) {
      return res
        .status(400)
        .json({
          errors: "Le lien de réinitialisation est invalide ou a expiré.",
        });
    }

    // Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error
    );
    res.status(500).json({ errors: "Une erreur interne s'est produite." });
  }
};

// fonction pour afficher la page profil
let succesUpdatePassword = "";
let messsageErrorUpdatepassword = "";
exports.profil = async (req, res) => {
  if (req.session.user === undefined) {
    return res.redirect("/deliver/registerLogin");
  }

  if (!req.session.user.profileImagePath) {
    req.session.user.profileImagePath = "/images/defaultUserProfil.jpg";
  }

  const user = req.session.user;
  // Verification du message succes lors de la modification du mot de passe
  console.log(req.session.succesUpdatePassword);
  if (req.session.succesUpdatePassword == "Mot de passe modifié avec succès") {
    succesUpdatePassword = req.session.succesUpdatePassword;
    req.session.succesUpdatePassword = "Pas d'info";
  } else {
    succesUpdatePassword = "Pas d'info";
  }

  console.log("messsageErrorUpdatepassword ** : " + succesUpdatePassword);
  // Verification du message d'erreur lors de la modification du mot de passe
  console.log(req.session.messsageErrorUpdatepassword);
  if (req.session.messsageErrorUpdatepassword !== undefined) {
    messsageErrorUpdatepassword = req.session.messsageErrorUpdatepassword;
    req.session.messsageErrorUpdatepassword = "";
  } else {
    messsageErrorUpdatepassword = "";
  }

  res.render("moncompte", {
    user,
    succesUpdatePassword,
    messsageErrorUpdatepassword,
    URL,
  });
};

// Update Mot de passe

exports.updatePassword = async (req, res) => {
  try {
    // Extraire les champs du corps de la requête
    const {
      "confirm-password": confirmPassword,
      "new-password": newPassword,
      "current-password": currentPassword,
    } = req.body;

    // Vérifier que tous les champs sont remplis
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.session.messsageErrorUpdatepassword =
        " Veuillez remplir tous les champs.";

      return res.status(400).redirect("/deliver/profil");
    }

    // Vérifier que le nouveau mot de passe et la confirmation correspondent
    if (newPassword !== confirmPassword) {
      req.session.messsageErrorUpdatepassword =
        "Les mots de passe ne correspondent pas.";
      return res.status(400).redirect("/deliver/profil");
    }

    // Trouver l'utilisateur par son ID (supposons que l'utilisateur est stocké dans req.user après une authentification)
    const user = await User.findById(req.session.user._id);

    // Si l'utilisateur n'existe pas
    if (!user) {
      req.session.messsageErrorUpdatepassword =
        "Les mots de passe ne correspondent pas.";

      return res.status(404).redirect("/deliver/profil");
    }

    // Vérifier si le mot de passe actuel est correct
    const isMatch = await bcrypt.compare(currentPassword, user.password); // user.password est le mot de passe haché dans la DB
    if (!isMatch) {
      req.session.messsageErrorUpdatepassword =
        "Mot de passe actuel incorrect.";

      return res.status(400).redirect("/deliver/profil");
    }

    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe de l'utilisateur
    user.password = hashedPassword;
    await user.save();

    // Retourner une réponse positive
    req.session.succesUpdatePassword = "Mot de passe modifié avec succès";
    res.status(200).redirect("/deliver/profil");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

//Mettre à jour l'utilisateur
exports.updateUser = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/deliver/registerLogin");
  }

  try {
    const { name, email, phone, address, bio } = req.body;
    const user = await User.findById(req.session.user._id);

    // Mise à jour uniquement des champs modifiés
    if (name && name !== user.username) {
      user.username = name;
    }
    if (email && email !== user.email) {
      user.email = email;
    }
    if (phone && phone !== user.numberPhone) {
      user.numberPhone = phone;
    }
    if (address && address !== user.address) {
      user.address = address;
    }
    if (bio && bio !== user.bio) {
      user.bio = bio;
    }

    // Sauvegarder les informations mises à jour dans la base de données
    await user.save();

    // Mettre à jour la session utilisateur après modification
    req.session.user = user;

    res.redirect("/deliver/profil"); // Rediriger vers la page de profil après la mise à jour
  } catch (error) {
    console.log(
      "Erreur lors de la mise à jour des informations utilisateur : ",
      error.message
    );
    res
      .status(500)
      .send("Une erreur est survenue lors de la mise à jour des informations.");
  }
};

// Page d'inscription pour vendeur
exports.registerVendor = async (req, res) => {
  msgErrorInscVendor = req.session.msgErrorInscVendor;
  res.render("inscriptionVendeur", { msgErrorInscVendor, URL });
};

// Page de connexion pour vendeur
exports.loginVendor = async (req, res) => {
  msgErrorConnVendor = req.session.msgErrorConnVendor;
  res.render("connexionVendeur", { msgErrorConnVendor, URL });
};

// Page de gestion de connexion pour vendeur
// exports.loginGestion = async (req, res) => {
//   let error = "";
//   try {
//     const { email, password, rememberMe } = req.body;

//     // Validation des champs obligatoires
//     if (!email || !password) {
//       error = "Email et mot de passe sont requis.";
//       req.session.msgErrorConnVendor = {
//         error,
//         email,
//         password,
//       };

//       return res.status(400).redirect("/deliver/loginVendor");
//     }

//     // Vérification de l'existence du vendeur
//     const vendor = await Vendor.findOne({ email: email });
//     if (!vendor) {
//       error = "Email ou mot de passe incorrect.";

//       req.session.msgErrorConnVendor = {
//         error,
//         email,
//         password,
//       };
//       return res.status(400).redirect("/deliver/loginVendor");
//     }

//     // Comparaison du mot de passe avec le hash dans la base de données
//     const isMatch = await bcrypt.compare(password, vendor.password);
//     if (!isMatch) {
//       error = "Email ou mot de passe incorrect.";

//       req.session.msgErrorConnVendor = {
//         error,
//         email,
//         password,
//       };

//       return res.status(400).redirect("/deliver/loginVendor");
//     }

//     if (vendor.status === "blocked") {
//       return console.log("Utilisateur bloqué");
//     }

//     // Réinitialisation de la session
//     req.session.regenerate((err) => {
//       if (err) {
//         console.error("Erreur lors de la régénération de la session :", err);
//         return res.status(500).json({
//           message: "Erreur serveur. Veuillez réessayer plus tard.",
//           error: err.message,
//         });
//       }

//       // Création de la nouvelle session pour le vendeur
//       req.session.vendor = vendor;

//       // Gestion de la durée de vie de la session
//       if (rememberMe) {
//         req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
//       } else {
//         req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 heures
//       }

//       // Redirection après connexion
//       return res.status(200).redirect("/deliver/");
//     });
//   } catch (err) {
//     console.error("Erreur lors de la connexion du vendeur :", err);

//     // Gestion des erreurs
//     return res.status(500).json({
//       message: "Erreur serveur. Veuillez réessayer plus tard.",
//       error: err.message,
//     });
//   }
// };

// Page de gestion de connexion pour vendeur
exports.loginGestion = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation des champs obligatoires
    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe sont requis.",
      });
    }

    // Vérification de l'existence du vendeur
    const vendor = await Vendor.findOne({ email: email });
    if (!vendor) {
      return res.status(400).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    // Comparaison du mot de passe avec le hash dans la base de données
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (vendor.status === "blocked") {
      return res.status(403).json({
        message: "Votre compte est bloqué. Veuillez contacter le support.",
      });
    }

    // Création de la nouvelle session pour le vendeur
    req.session.vendor = vendor;

    // Gestion de la durée de vie de la session (via cookie)
    const sessionOptions = rememberMe
      ? { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 jours
      : { maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 jours

    // Réponse avec succès
    return res.status(200).json({
      message: "Connexion réussie.",
      redirectUrl: "/deliver/", // URL de redirection
      sessionOptions, // Pour configurer la session côté client si nécessaire
    });
  } catch (err) {
    console.error("Erreur lors de la connexion du vendeur :", err);

    // Gestion des erreurs serveur
    return res.status(500).json({
      message: "Erreur serveur. Veuillez réessayer plus tard.",
      error: err.message,
    });
  }
};

// Déconnexion de l'utilisateur
exports.logoutUser = (req, res) => {
  console.log("logout");
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/deliver/");
  });
};

exports.productCateg = (req, res) => {
  let user;
  let vendor;
  if (req.session?.user) user = req.session.user;
  if (req.session?.vendor) vendor = req.session.vendor;

  const category = req.params.category;
  const navbarFooter = true;
  res.render("productCateg", { category, URL, navbarFooter, user, vendor });
};

exports.listChatUser = (req, res) => {
  let user;
  let vendor;
  if (req.session?.user) user = req.session.user;
  if (req.session?.vendor) vendor = req.session.vendor;

  const navbarFooter = true;
  res.render("listChatUser", { navbarFooter, user, vendor });
};

/**
 * Fonction pour récupérer la liste des discussions triée par le message le plus récent
 * @param {String} currentUserId - ID de l'utilisateur actuel (acheteur ou vendeur)
 * @returns {Array} - Liste des discussions
 */
exports.getListChatUser = async (req, res) => {
  const currentUserId = req.session.user?._id || req.session.vendor?._id;

  try {
    // Récupérer tous les messages impliquant l'utilisateur courant
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
    }).sort({ timestamp: 1 }); // Trie par ancienneté au départ

    const discussionsMap = {};

    // Construire une map basée sur produit + utilisateur
    for (const message of messages) {
      const otherUser =
        message.sender.toString() === currentUserId
          ? message.recipient
          : message.sender;
      const key = `${message.productId}-${otherUser}`;

      if (!discussionsMap[key]) {
        discussionsMap[key] = {
          productId: message.productId,
          userId: otherUser,
          lastMessage: message,
          unreadCount: 0,
        };

        if (message.recipient.toString() === currentUserId && message.unread) {
          discussionsMap[key].unreadCount += 1;
        }
      }

      // Mettre à jour avec le dernier message le plus récent
      if (
        new Date(message.timestamp) >
        new Date(discussionsMap[key].lastMessage.timestamp)
      ) {
        discussionsMap[key].lastMessage = message;
      }
    }

    // Transformer les discussionsMap en tableau et enrichir les données
    let discussions = await Promise.all(
      Object.values(discussionsMap).map(async (discussion) => {
        let blocked = false;

        // Charger les informations du produit et de l'utilisateur
        const product = await Product.findById(discussion.productId);
        const user =
          (await User.findById(discussion.userId)) ||
          (await Vendor.findById(discussion.userId));
        const currentUser =
          (await User.findById(currentUserId)) ||
          (await Vendor.findById(currentUserId));

        // Vérifier si l'utilisateur actuel ou l'autre utilisateur est bloqué
        // if (
        //   user?.listNoir.some(
        //     (blockedUser) => blockedUser.userId.toString() === currentUserId.toString()
        //   ) ||
        //   currentUser?.listNoir.some(
        //     (blockedUser) => blockedUser.userId.toString() === discussion.userId.toString()
        //   )
        // ) {
        //   blocked = true;
        // }
        // Vérifier si l'utilisateur actuel ou l'autre utilisateur est bloqué
        if (
          currentUser?.listNoir.some(
            (blockedUser) =>
              blockedUser.userId.toString() === discussion.userId.toString()
          )
        ) {
          blocked = true;
        }

        const formattedTimestamp = getFormattedTimestamp(
          discussion.lastMessage.timestamp
        );
        return {
          ...discussion,
          productName: product?.name || "Produit inconnu",
          productImages: product?.images.map((image) => image.path) || [],
          userName:
            user?.username || user?.companyName || "Utilisateur inconnu",
          userImage: user?.profileImagePath || "/images/defaultUserProfil.jpg",
          lastMessageTime: formattedTimestamp,
          blocked, // Champ ajouté
        };
      })
    );

    // Trier les discussions par l'horodatage du dernier message (plus récent en premier)
    discussions = discussions.sort((a, b) => {
      return (
        new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
      );
    });

    // Renvoyer les discussions triées
    res.status(200).json(discussions);
  } catch (err) {
    console.error("Erreur lors de la récupération des discussions :", err);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des discussions" });
  }
};

// Route pour afficher un produit sur une une page
// Backend Route for displaying a single product on a page
exports.pageMonoProduit = async (req, res) => {
  try {
    const productId = req.params.id;

    // Fetch product details from the database
    const product = await Product.findById(productId);
    console.log("product", product) 
    const sellerId = new mongoose.Types.ObjectId(product.seller);
    console.log("sellerId toString", sellerId.toString())
    const IdString = sellerId.toString()
    const seller = await Vendor.findById(IdString) || await User.findById(IdString);
     
    console.log("Seller", seller) 

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Render the product page with the product data
    res.render("pageMonoProduit", {
      product: {
        pickupLocation: product.pickupLocation,
        id: productId,
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        quantity: product.quantity,
        images: product.images,
        seller: seller,
        infoUser: product.infoUser,
        dateAdded: product.dateAdded,
        URL,
      },
    });
  } catch (error) {
    console.error(`Error fetching product: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
};

// page payement
exports.payement = async (req, res) => {
  res.render("payement", { URL });
};

// acceder à la page foire aux questions
exports.foireQuestion = async (req, res) => {
  res.render("foireQuestion", { URL });
};

// acceder à la page suivipayement
exports.suivipayement = async (req, res) => {
  res.render("suivipayement", { URL });
};

// Fonction utilitaire pour formater l'horodatage
function getFormattedTimestamp(timestamp) {
  const timeDiff = Date.now() - new Date(timestamp).getTime();
  if (timeDiff > 24 * 60 * 60 * 1000) {
    return `${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} jours`;
  }
  return new Date(timestamp).toLocaleTimeString();
}

exports.legalNotice = (req, res) => {
  res.render('legal-notice', { title: 'Mentions légales' });
}
exports.privacyPolicy = (req, res) => {
  res.render('privacy-policy', { title: 'Politique de confidentialité' });
}

// /**
//  * Fonction pour récupérer la liste des discussions triée par le message le plus récent
//  * @param {String} currentUserId - ID de l'utilisateur actuel (acheteur ou vendeur)
//  * @returns {Array} - Liste des discussions
//  */
// exports.getListChatUser = async (req, res) => {
//   const currentUserId = req.session.user?._id || req.session.vendor?._id;
//   let blocked = false

//   try {
//     // Récupérer tous les messages impliquant l'utilisateur courant
//     const messages = await Message.find({
//       $or: [{ sender: currentUserId }, { recipient: currentUserId }],
//     }).sort({ timestamp: 1 }); // Trie par ancienneté au départ

//     const discussionsMap = {};

//     // Construire une map basée sur produit + utilisateur
//     for (const message of messages) {
//       const otherUser =
//         message.sender.toString() == currentUserId
//           ? message.recipient
//           : message.sender;
//       const key = `${message.productId}-${otherUser}`;

//       if (!discussionsMap[key]) {
//         discussionsMap[key] = {
//           productId: message.productId,
//           userId: otherUser,
//           lastMessage: message,
//           unreadCount: 0,
//         };

//         // console.log(message.recipient.toString(), currentUserId, message.unread)

//         if (message.recipient.toString() === currentUserId && message.unread) {
//           discussionsMap[key].unreadCount += 1;
//         }
//       }

//       // Mettre à jour avec le dernier message le plus récent
//       if (
//         new Date(message.timestamp) >
//         new Date(discussionsMap[key].lastMessage.timestamp)
//       ) {
//         discussionsMap[key].lastMessage = message;
//       }
//     }
//     //console.log("discussionsMap", discussionsMap)

//     // Transformer les discussionsMap en tableau et enrichir les données
//     let discussions = await Promise.all(
//       Object.values(discussionsMap).map(async (discussion) => {
//         blocked  = false
//         const product = await Product.findById(discussion.productId);
//         const user =
//           (await User.findById(discussion.userId)) ||
//           (await Vendor.findById(discussion.userId));

//         const formattedTimestamp = getFormattedTimestamp(
//           discussion.lastMessage.timestamp
//         );

//         return {
//           ...discussion,
//           productName: product?.name || "Produit inconnu",
//           productImages: product?.images.map((image) => image.path) || [],
//           userName:
//             user?.username || user?.companyName || "Utilisateur inconnu",
//           userImage: user?.profileImagePath || "/images/defaultUserProfil.jpg",
//           lastMessageTime: formattedTimestamp,
//           blocked
//         };

//       })
//     );

//     // Trier les discussions par l'horodatage du dernier message (plus récent en premier)
//     discussions = discussions.sort((a, b) => {
//       return (
//         new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
//       );
//     });

//     // Renvoyer les discussions triées
//     res.status(200).json(discussions);
//   } catch (err) {
//     console.error("Erreur lors de la récupération des discussions :", err);
//     res
//       .status(500)
//       .json({ error: "Erreur lors de la récupération des discussions" });
//   }
// };

// // Fonction utilitaire pour formater l'horodatage
// function getFormattedTimestamp(timestamp) {
//   const timeDiff = Date.now() - new Date(timestamp).getTime();
//   if (timeDiff > 24 * 60 * 60 * 1000) {
//     return `${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} jours`;
//   }
//   return new Date(timestamp).toLocaleTimeString();
// }

// exports.registerLogin = (req, res) => {
//   const tabId = req.cookies?.tabId;  // Utilisation de l'opérateur optionnel pour vérifier si cookies existe
//   let messageError = "";

//   if (!tabId) {
//       console.log("tabId is missing in cookies");
//   } else if (req.session[tabId]) {
//       messageError = req.session[tabId].messageError;
//   }

//   console.log(messageError);
//   res.render("registerLogin", { messageError });
// };

// req.session[req.cookies.tabId] = {
//   messageError: {
//     email,
//     password,
//     errors,
//     formType: "login",
//   },
// };
