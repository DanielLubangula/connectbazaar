const User = require("../models/User");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const Vendor = require("../models/Vendor"); // Assurez-vous d'inclure votre modèle Vendor
const Product = require("../models/product");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const Payment = require("../models/payement")
const URL = "localhost"

// console.log("process.env.SENDGRID_API_KEY", process.env.SENDGRID_API_KEY)

// Page dashbordVendor pour vendeur
exports.dashbordVendor = (req, res) => {
  if (!req.session.vendor.profileImagePath) {
    req.session.vendor.profileImagePath = "/images/defaultUserProfil.jpg";
  }

  res.render("dashbordVendor", { 
    navbarVendor: true,  
    titre: "Dashboard Vendeur",
    activeongletdas: true,
    URL
  });
};

// Page de l'onglet product pour vendeur
exports.productVendor = async (req, res) => {
  if (!req.session.vendor) {
    return res.redirect("/deliver");
  }
  let CheckStatus = ""
   // Rechercher le status de payement
  if (req.session.vendor){
    let userEmail = req.session.vendor.email 
    let isPayement = await Payment.findOne({
      email : userEmail
    })

    if (isPayement) CheckStatus = isPayement.status
    
  }

  const navbarFooter = true
  const vendor = req.session.vendor;
  res.render("productVendor", {
    navbarVendor: true,
    titre: "Gestion des Produits",
    activeongletprod: true,
    vendor,
    CheckStatus,
    URL,
    navbarFooter
  });
};

// Route API pour obtenir les produits du vendeur
exports.apiProduct = async (req, res) => {
  if (!req.session.vendor) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  try {
    // Récupérer les produits et les trier par `dateAdded` (les plus récents en premier)
    const products = await Product.find({
      seller: req.session.vendor._id,
    })
      .sort({ dateAdded: -1 })
      .limit(10); // -1 pour ordre décroissant
    res.json(products);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Page de l'onglet profil pour vendeur
exports.profilVendor = async (req, res) => {
  if (!req.session.vendor) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  const Seller = await Vendor.find({
    _id: req.session.vendor._id,
  });
  const seller = req.session.vendor;

  if (!req.session.vendor.profileImagePath) {
    req.session.vendor.profileImagePath = "/images/defaultUserProfil.jpg";
  }

  res.render("profilVendor", {
    seller,
    navbarVendor: true,
    titre: "Profil",
    activeongletpro: true,
    URL
  });
};

// Page de l'onglet livraison pour vendeur
exports.livraisonVendor = (req, res) => {
  res.render("livraisonVendor", {
    navbarVendor: true,
    titre: "Livraisons",
    activeongletliv: true,
    URL
  });
};

// Page de l'onglet commandeVendor pour vendeur
exports.commandeVendor = (req, res) => {
  res.render("commandeVendor", {
    navbarVendor: true,
    titre: "Gestion des Commandes",
    activeongletcom: true,
    URL
  });
};

exports.up = (req, res) => {
  res.render("up",{URL});
};

exports.reinitialise = (req, res) => {
  res.render("motdepasseoublievendeur", {URL});
};

exports.traitementMotdepasseoublie = async (req, res) => {
  const { email } = req.body;
  try {
    console.log(email);
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).send("Aucun utilisateur trouvé avec cet e-mail.");
    }

    // Générer un token sécurisé
    const token = crypto.randomBytes(20).toString("hex");

    // Enregistrer le token et son expiration
    vendor.resetPasswordToken = token;
    vendor.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await vendor.save();

    // Envoyer l'e-mail avec SendGrid
    const resetUrl = `http://${req.headers.host}/deliver/seller/reset-password/${token}`;
    const msg = {
      to: email,
      from: "chataidedaniel@gmail.com",
      subject: "Réinitialisation de mot de passe",
      html: `
        <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien suivant pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    };
    await sgMail.send(msg);

    res.status(200).send("E-mail de réinitialisation envoyé !");
  } catch (err) {
    // res.status(500).send("Erreur serveur.", err);
    console.log(
      "Erreur lors de l'envoie de l'email de réinitialisation: ",
      err
    );
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  try {
    const vendor = await Vendor.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Vérifie que le token n'a pas expiré
    });

    if (!vendor) {
      return res.status(400).send("Le lien est invalide ou a expiré.");
    }

    // Rendre une vue pour entrer le nouveau mot de passe
    res.render("reset-password", { token , URL});
  } catch (err) {
    res.status(500).send("Erreur serveur.");
  }
};

exports.newPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Les mots de passe ne correspondent pas.");
  }

  try {
    const vendor = await Vendor.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!vendor) {
      return res.status(400).send("Le lien est invalide ou a expiré.");
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    vendor.password = hashedPassword;

    // Réinitialiser les champs de token
    vendor.resetPasswordToken = null;
    vendor.resetPasswordExpires = null;

    await vendor.save();

    res.status(200).send("Mot de passe réinitialisé avec succès !");
  } catch (err) {
    res.status(500).send("Erreur serveur.");
  }
};

exports.logoutVendor = async (req, res) => {

  console.log("ici ici")
  if (req.session.vendor) {
    req.session.destroy((err) => {
      if (err) {
        console.error(
          "Erreur lors de la destruction de la session vendeur :",
          err
        );
        return res.status(500).send("Erreur lors de la déconnexion.");
      }
      // Redirection vers la page principale après déconnexion
      res.redirect("/deliver");
    });
  } else {
    // Si aucun vendeur n'est connecté, rediriger directement
    res.redirect("/deliver");
  }
};
