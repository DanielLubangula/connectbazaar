const User = require("../models/User");
const Vendor = require("../models/Vendor")
const Product = require("../models/product")
const ProductComment = require("../models/ProductComment")
const Message = require('../models/Message')
const URL = "localhost"

exports.chat = async (req, res) => {
    const userId = req.params.idUser
    const productId = req.params.idProduct

    // Rechercher le nom et le chemin de l'image de l'utilisateur
    const user = await User.findById(userId) || await Vendor.findById(userId)

    // Recherhe de l'utilisateur connecté
    const userSessionId = req.session.user?._id || req.session.vendor?._id

    if (!productId){
        return res.redirect('/deliver/')       
    }
    // Recherche du produit
    const product = await Product.findById(productId)

    // Récupération du nom et du chemin de l'image
    const username = user?.username || user?.companyName
    const profileImagePath = user.profileImagePath || "/images/defaultUserProfil.jpg"

    // Récupération du produit
    const images = product.images
    const nameProduct = product.name

    res.render("chatInterface", {
        productId,
        userId,
        username,
        profileImagePath,
        images,
        nameProduct,
        userSessionId,
        URL
    })
}

/**
 * Marque tous les messages comme lus pour un utilisateur et un produit donnés
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.markMessagesAsRead = async (req, res) => {
  // Étape 1 : Récupérer l'utilisateur actuel
  const currentUserId = req.session.user?._id || req.session.vendor?._id;
  
  // Étape 2 : Récupérer les données du destinataire et du produit
  const { recipientId, productId } = req.body;
  
  // Étape 3 : Vérifier que toutes les données nécessaires sont présentes
  if (!currentUserId || !recipientId || !productId) {
    return res.status(400).json({ 
      success: false, 
      error: "Données manquantes. Assurez-vous d'envoyer recipientId et productId." 
    });
  }
  
  try {
    // Étape 4 : Vérifier si l'un des utilisateurs a bloqué l'autre
    const currentUser = await User.findById(currentUserId) || await Vendor.findById(currentUserId);
    const recipient = await User.findById(recipientId) || await Vendor.findById(recipientId);

    if (!currentUser || !recipient) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur ou destinataire introuvable.",
      });
    }

    // Vérifier si l'utilisateur actuel a bloqué le destinataire
    if (currentUser?.listNoir && currentUser?.listNoir.some((blockedUser) => {
      if (blockedUser.userId.toString() == recipientId){ return true}
    }
    )) {
      return res.status(403).json({
        success: false,
        error: "Action interdite. Vous avez bloqué cet utilisateur.",
      });
    }

    

    // Vérifier si le destinataire a bloqué l'utilisateur actuel
    if (recipient.blockedUsers && recipient.blockedUsers.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        error: "Action interdite. Cet utilisateur vous a bloqué.",
      });
    }

    // Étape 5 : Mettre à jour les messages non lus
    await Message.updateMany(
      {
        sender: recipientId, // Expéditeur des messages
        recipient: currentUserId, // Destinataire (l'utilisateur connecté)
        productId: productId, // Produit concerné
        unread: true, // Seulement les messages non lus
      },
      { $set: { unread: false } } // Action : marquer comme lus
    );

    // Étape 6 : Répondre avec succès
    return res.status(200).json({
      success: true,
      message: "Messages marqués comme lus.",
    });
  } catch (error) {
    // Étape 7 : Gérer les erreurs
    console.error("Erreur lors de la mise à jour des messages :", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour des messages.",
    });
  }
};


// /**
//  * Marque tous les messages comme lus pour un utilisateur et un produit donnés
//  * @param {Object} req - Requête Express
//  * @param {Object} res - Réponse Express
//  */
// exports.markMessagesAsRead = async (req, res) => {
//     // Étape 1 : Récupérer l'utilisateur actuel
//     const currentUserId = req.session.user?._id || req.session.vendor?._id;
  
//     // Étape 2 : Récupérer les données du destinataire et du produit
//     const { recipientId, productId } = req.body;
  
//     // Étape 3 : Vérifier que toutes les données nécessaires sont présentes
//     if (!currentUserId || !recipientId || !productId) {
//       return res.status(400).json({ 
//         success: false, 
//         error: "Données manquantes. Assurez-vous d'envoyer recipientId et productId." 
//       });
//     }
  
//     try {
//       // Étape 4 : Mettre à jour les messages non lus
//       await Message.updateMany(
//         {
//           sender: recipientId, // Expéditeur des messages
//           recipient: currentUserId, // Destinataire (l'utilisateur connecté)
//           productId: productId, // Produit concerné
//           unread: true, // Seulement les messages non lus
//         },
//         { $set: { unread: false } } // Action : marquer comme lus
//       );
  
//       // Étape 5 : Répondre avec succès
//       return res.status(200).json({
//         success: true,
//         message: "Messages marqués comme lus.",
//       });
//     } catch (error) {
//       // Étape 6 : Gérer les erreurs
//       console.error("Erreur lors de la mise à jour des messages :", error);
//       return res.status(500).json({
//         success: false,
//         error: "Erreur lors de la mise à jour des messages.",
//       });
//     }
//   };
  