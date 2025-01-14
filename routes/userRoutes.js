const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const imageController = require("../controllers/imageController");
const vendorController = require("../controllers/vendorController");
const apiController = require("../controllers/apiController");
const chatController = require("../controllers/chatController");
const adminController = require("../controllers/adminController");
const paymentController = require('../controllers/payementController');
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Admin = require("../models/Admin");
const Message = require("../models/Message");
const Product = require("../models/product");
 const Payment = require('../models/payement');
const ProductComment = require("../models/ProductComment");
const multer = require("multer");
// All user

router.get("/allpayement", async function (req, res) {
  const alluser = await Payment.find({});
  res.send(alluser);
});

router.get("/allUser", async function (req, res) {
  const alluser = await User.find({}).select("-bufferString");
  res.send(alluser);
});

router.get("/adminUser", async function (req, res) {
  const alluser = await Admin.find({});
  res.send(alluser);
});

// All Message

router.get("/allMessage", async function (req, res) {
  const alluser = await Message.find({});
  res.send(alluser);
});

// All Product

router.get("/allproduct", async function (req, res) {
  const alluser = await Product.find({});
  res.send(alluser);
});
router.get("/allproductvendor", async function (req, res) {
  const products = await Product.find({
    seller: req.session.vendor._id,
  }).sort({ dateAdded: -1 }); // -1 pour ordre décroissant
  res.json(products);
});

router.get("/allProductComment", async function (req, res) {
  const alluser = await ProductComment.find({});
  res.send(alluser);
});

// All Vendor
router.get("/allvendor", async (req, res) => {
  const allvendor = await Vendor.find({}).select("-bufferString");
  res.send(allvendor);
});
// Upload image
const upload = multer({
  limits: {
    fileSize: 5000000, // Taille limite de l'image 5 mb
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      //Prend en charge les images en format jpg,jpeg,png
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});

// Page d'acceuil
router.get("/", userController.acceuil);

// Route pour traiter les données du formulaire d'inscription
router.post("/register", userController.registerUser);

// Route pour la page registerLogin
router.get("/registerLogin", userController.registerLogin);

// Route pour la page registerLogin
router.get("/forgotPassword", userController.forgotPasswordPage);

// Route pour le traitement registerLogin
router.post("/forgotPassword", userController.forgotPassword);

// Endpoint pour définir un nouveau mot de passe 
router.post("/resetPassword ",checkAuthentication, userController.resetPassword);

// Route pour traiter les données du formulaire de connexion
router.post("/login", userController.loginUser);

// Route pour la page profil
router.get("/profil", checkAuthentication, userController.profil);

// Route pour déconnecter l'utilisateur
router.get("/logout", checkAuthentication, userController.logoutUser);

// Route pour le traitement des images avec gestion des erreurs
router.post("/upload", checkAuthentication,imageController.uploadImage);

// Update Mot de Passe
router.post("/updatePassword", userController.updatePassword);

//Mettre à jour l'utilisateur
router.post("/updateUser", checkAuthentication,userController.updateUser);

// Page d'inscription pour vendeur
router.get("/registerVendor", userController.registerVendor);

// Page pour la gestion d'inscription des vendeurs
router.post("/registerGestion", imageController.registerGestion);

// Page pour la gestion de connexion de vendeurs
router.post("/loginGestion", userController.loginGestion);

// Page d'authentification pour vendeur
router.get("/loginVendor", userController.loginVendor);

// Page Dashbord pour vendeur
router.get("/dashbordVendor", checkAuthentication,vendorController.dashbordVendor);

// Page de l'onglet product pour vendeur
router.get("/productVendor", checkAuthentication,vendorController.productVendor);

// Page de profil product pour vendeur
router.get("/profilVendor", checkAuthentication,vendorController.profilVendor);

// Page de livraison product pour vendeur
router.get("/livraisonVendor", checkAuthentication,vendorController.livraisonVendor);

// Page de commandeVendor product pour vendeur
router.get("/commandeVendor", checkAuthentication,vendorController.commandeVendor);

// route de traitement et enregistrement de photo produit pour vendeur
router.post("/productPublieVendor", checkAuthentication,imageController.productPublieVendor);

// route de traitement et enregistrement de photo produit pour vendeur
router.get("/apiProduct", checkAuthentication,vendorController.apiProduct);

// Route pour supprimer un produit
router.delete("/api/products/:id", checkAuthentication,apiController.deleteProduct);

// Route pour mettre à jour le produit
router.put("/api/editProduct/:id", checkAuthentication,apiController.editProduct);

// Route pour charger le produit (infiniteScroll)
router.post("/api/chargeproduct/:id", checkAuthentication,apiController.infiniteScrollProduct);

// Route pour mettre à jour les informations du vendeur
router.put("/vendor/update", checkAuthentication,apiController.updateVendorInfo);

// Route pour mettre à jour le mot de passe du vendeur
router.put("/vendor/update-password", checkAuthentication,apiController.updatePassword);

// Fonction de mise à jour de l'image de profil
router.post("/vendor/updateProfileImage", checkAuthentication,apiController.updateProfileImage);

// Récupérer les préférences d'un vendeur
router.get("/api/preferencVendor", checkAuthentication,apiController.preferencVendor);

// Mettre à jour les préférences d'un vendeur
router.put("/api/updatePreferences", checkAuthentication,apiController.updatePreference);

// Fonction pour récupérer trois produits de chaque catégorie spécifiée
router.get("/allCatalogue", apiController.allCatalogue);

// Fonction pour récupérer le nombre de commentaires d'un produit
router.post("/api/numberComment/", apiController.numberComment);

// Fonction pour récupérer les informations de l'utilisateur 
router.post("/api/userinfo/", apiController.userinfo);

// Supprimer le commentaire d'un produit
router.delete("/api/comments/delete-comment/:commentId", checkAuthentication,apiController.commentDelete);

// Voir la page produits de chaque catégorie
router.get("/productCateg/:category", userController.productCateg);

// Voir les produits de chaque catégorie
router.post("/apiProductDetail/", apiController.apiProductDetail);

// Affichage de l'interface de chat
router.get("/chat/:idUser/:idProduct", checkAuthentication,chatController.chat);

// récupération du chat
router.post("/api/uploadChat/", checkAuthentication,apiController.uploadChat);

// récuperation des messages
router.post("/api/chat/",checkAuthentication, apiController.recuperChat);

// Affichage de la page pour voir la liste des utilisateur
router.get("/listChatUser/",checkAuthentication, userController.listChatUser);

// Affichage de la liste des utilisateur avec qui l'on a eu à discuter
router.post("/getListChatUser/", checkAuthentication, userController.getListChatUser);

// Changer les status de message de non lue vers lue
router.post("/api/markMessagesAsRead/", checkAuthentication, chatController.markMessagesAsRead);

// Changer les status de message de non lue vers lue
router.post("/api/numbreNotifListChat/",checkAuthentication, apiController.numbreNotifListChat);

// Mettre un utilisateur dans la liste noir
router.post("/api/listNoir/",checkAuthentication, apiController.listNoir);

// Route pour supprimé le message chat
router.post("/api/deleteMessage/",checkAuthentication, apiController.deleteMessage);

// Route admin login
router.get("/admin/connect/", adminController.loginAdmin);

// Route admin pour voir les utilisateurs
router.get("/admin/connect/viewUserAdmin", adminController.viewUserAdmin);

// Route admin pour voir les payement
router.get("/admin/connect/payement", adminController.payement);

// Route admin login traitement
router.post("/api/loginAdmin/", adminController.loginTraitement);

// Route admin login traitement
router.get("/api/findAlluser/", adminController.findAlluser);

// Bloquer ou débloquer un utilisateur
router.put(
  "/api/findAlluser/users/:id/toggle-status",
  adminController.toggleStatus
);

// Route admin pour supprimé un utilisateur
router.delete("/api/findAlluser/users/:id", adminController.deleteUser);

// Route admin pour acceder à la page produit
router.get("/admin/connect/viewProduct", adminController.viewProduct);

// Route récuperer les produits
router.get("/admin/api/findProduct", adminController.findAllProduct);

// Route admin pour acceder à la page produit
router.delete("/admin/api/findProduct/:id", adminController.deleteProductAdmin);

// Route pour acceder à la page produit 
router.get("/pageMonoProduit/:id", userController.pageMonoProduit);

// Route pour acceder à la page de payement 
router.get("/payement/", userController.payement);

// Route pour poster le preuve de payement 
router.post("/gestionPayement/",checkAuthentication, adminController.gestionPayement);

// Route la page foireQestion
router.get("/foireQuestion/",checkAuthentication, userController.foireQuestion);

// Route pour accéder à la page suivipayement
router.get("/suivipayement/",checkAuthentication, userController.suivipayement);

// Récupère la liste complète des paiements.
router.get('/api/payments', paymentController.getPayments);

// Effectue une recherche parmi les paiements en fonction de critères (nom, email, date, statut).
router.get('/api/payments/search', paymentController.searchPayments);

// Met à jour le statut d'un paiement spécifique (Approuvé, En attente, Rejeté).
router.put('/api/payments/:id/status', paymentController.updateStatus);

// Ajoute ou met à jour une note pour un paiement spécifique.
router.put('/api/payments/:id/note', paymentController.addNote);

// Exporte la liste des paiements au format CSV.
router.get('/api/payments/export', paymentController.exportPayments);

// récuperation de statistiques
router.get('/api/payments/stats', paymentController.stats);

// api pour vérifier le status
router.get('/api/verificationpayement', paymentController.getPaymentStatus);

// api pour réinitialiser le mot de passe
router.get("/seller/forgot-password", vendorController.reinitialise)

// api pour réinitialiser le mot de passe
router.post("/seller/forgot-password", vendorController.traitementMotdepasseoublie)

// api pour afficher la page pour réinitialiser le mot de passe
router.get("/seller/reset-password/:token", vendorController.resetPassword)

// api pour afficher la page pour réinitialiser le mot de passe
router.post("/seller/reset-password/:token", vendorController.newPassword)

// Route pour déconnecter le vendeur
router.post("/logout/vendor", checkAuthentication,vendorController.logoutVendor)

// Route pour récupérer la liste de pays
router.get("/api/countries", apiController.allContries)

// Route pour récupérer le nombre de notification
router.post("/api/numberNotifMessage", userController.numberNotifMessage)

router.post('/initiate-payment/', paymentController.initiatePayment)

router.get('/payementV', paymentController.payementV)

router.post('/payment-notify', paymentController.paymentNotify)

router.get('/payment-success', paymentController.paymentSuccess)

router.get("/privacy-policy", userController.privacyPolicy)

router.get("/legal-notice", userController.legalNotice)

function checkAuthentication(req, res, next) {
  if (req.session.user || req.session.vendor) {
    // Si une session existe (user ou vendor), continuer
    return next();
  }
  // Sinon, rediriger vers /deliver
  res.redirect('/deliver');
}


module.exports = router;
