const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Message = require("../models/Message");
const Product = require("../models/product"); //
const likedProduct = require("../models/likeProduct");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { format } = require("date-fns");
const uploadDirMessage = path.join(__dirname, "..", "uploads", "messages");
const fs = require("fs");

let idUser = "";
// Stocker l'état des utilisateurs
const onlineUsers = new Map(); // Map pour stocker les utilisateurs connectés

// socket.js
const ProductComment = require("../models/ProductComment"); // Assurez-vous de charger votre modèle
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`${io.engine.clientsCount} utilisateurs connectés`);
    socket.emit("userConnect", io.engine.clientsCount);

    const session = socket.request.session;
    if (session.user?._id || session.vendor?._id) {
      // Association de l'id de l'utilisateur et le socket.id
      onlineUsers.set(session.user?._id || session.vendor?._id, {
        socketId: socket.id,
        lastSeen: null,
      });
    }

    let roomNameGlobal = "";

    socket.on("joinChatRoom", async ({ productId, otherUserId }, callback) => {
      try {
        // Récupérer l'utilisateur connecté à partir de la session
        const currentUser =
          socket.request.session.user || socket.request.session.vendor;

        if (!currentUser) {
          return callback({
            success: false,
            error: "Utilisateur non authentifié.",
          });
        }

        // Vérifier le rôle de l'utilisateur connecté (vendeur ou acheteur)
        const product = await Product.findById(productId);

        if (!product) {
          return callback({ success: false, error: "Produit introuvable." });
        }

        let sellerId, buyerId;

        if (currentUser._id.toString() === product.seller.toString()) {
          // L'utilisateur connecté est le vendeur
          sellerId = currentUser._id;
          buyerId = otherUserId; // L'autre utilisateur est l'acheteur
        } else {
          // L'utilisateur connecté est l'acheteur
          buyerId = currentUser._id;
          sellerId = otherUserId; // L'autre utilisateur est le vendeur
        }

        // Construire le nom unique du salon
        const roomName = `${sellerId}-${buyerId}-${productId}`;
        roomNameGlobal = roomName;
        // Joindre le salon
        socket.join(roomName);

        // Retourner une confirmation au client
        callback({ success: true, roomName });
      } catch (error) {
        console.error("Erreur lors de la connexion au salon :", error);
        callback({ success: false, error: "Erreur interne du serveur." });
      }
    });

    const multerS3 = require("multer-s3");
    const {
      S3Client,
      DeleteObjectCommand,
      PutObjectCommand,
    } = require("@aws-sdk/client-s3");

    const s3 = require("../config/aws"); // Assurez-vous que `s3` est une instance de `S3Client`.

    const uploadFileToS3 = async (buffer, filename, mimetype) => {
      try {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME, // Nom de votre bucket
          Key: `messages/${filename}`, // Chemin et nom du fichier dans S3
          Body: buffer,
          ContentType: mimetype,
        };

        const command = new PutObjectCommand(params);
        await s3.send(command); // Envoie la commande au client S3
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/messages/${filename}`;

        return fileUrl;
      } catch (error) {
        console.error("Erreur lors de l'upload sur S3:", error);
        throw error;
      }
    };

    // socket.on("sendMessage", async (data, callback) => {
    //   const sender =
    //     socket.request.session.user?._id || socket.request.session.vendor?._id;

    //   const { recipient, content, images, productId, audios, parentId } = data;

    //   try {
    //     // Vérification des utilisateurs
    //     const senderUser =
    //       (await User.findById(sender)) || (await Vendor.findById(sender));
    //     const recipientUser =
    //       (await User.findById(recipient)) || (await Vendor.findById(recipient));

    //     if (!senderUser || !recipientUser) {
    //       return callback({
    //         success: false,
    //         error: "Utilisateur introuvable.",
    //       });
    //     }

    //     // Vérification des blocages
    //     const isSenderBlocked = recipientUser.listNoir.some(
    //       (blockedUser) => blockedUser.userId.toString() === sender
    //     );
    //     const isRecipientBlocked = senderUser.listNoir.some(
    //       (blockedUser) => blockedUser.userId.toString() === recipient
    //     );

    //     if (isSenderBlocked || isRecipientBlocked) {
    //       return callback({
    //         success: false,
    //         error: "Communication bloquée.",
    //       });
    //     }

    //     // Traitement des images et upload sur S3
    //     const processedImages = images
    //       ? await Promise.all(
    //           images.map(async (imageBuffer, index) => {
    //             const processedImageBuffer = await sharp(imageBuffer)
    //               .resize({ width: 320, height: 280 })
    //               .jpeg({ quality: 80 })
    //               .toBuffer();

    //             const filename = `messages/images/${Date.now()}_${index}.jpg`;
    //             const fileUrl = await uploadFileToS3(
    //               processedImageBuffer,
    //               filename,
    //               "image/jpeg"
    //             );

    //             if (!fileUrl) {
    //               throw new Error("Échec de l'upload S3 pour l'image.");
    //             }

    //             return {
    //               path: fileUrl, // URL retournée par `uploadFileToS3`
    //               contentType: "image/jpeg",
    //             };
    //           })
    //         )
    //       : [];

    //     // Traitement des audios (désactivé pour l'instant, à activer si nécessaire)
    //     // let processedAudios;
    //     // if (audios && audios.length > 0) {
    //     //   processedAudios = await Promise.all(
    //     //     audios.map(async (audioBuffer, index) => {
    //     //       const MAX_SIZE_MB = 10;
    //     //       const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    //     //       if (audioBuffer.length > MAX_SIZE_BYTES) {
    //     //         throw new Error(
    //     //           `L'audio dépasse la taille maximale de ${MAX_SIZE_MB} Mo.`
    //     //         );
    //     //       }

    //     //       const filename = `audio_${Date.now()}_${index}.mp3`;
    //     //       const filePath = `/messages/audios/${filename}`;

    //     //       return {
    //     //         path: filePath,
    //     //         contentType: "audio/mpeg",
    //     //       };
    //     //     })
    //     //   );
    //     // }

    //     // Enregistrement du message dans MongoDB
    //     const newMessage = new Message({
    //       sender,
    //       recipient,
    //       content,
    //       productId,
    //       images: processedImages,
    //       // audios: processedAudios,
    //       timestamp: new Date(),
    //       parentId,
    //     });

    //     const savedMessage = await newMessage.save();

    //     // Notification au destinataire
    //     const recipientFound = onlineUsers.get(recipient);
    //     console.log("const recipientFound ", recipientFound)
    //     const senderFound = onlineUsers.get(sender);

    //     if (recipientFound) {
    //       io.to(roomNameGlobal).emit("newMessage", {
    //         sender,
    //         recipient,
    //         content,
    //         productId,
    //         images: processedImages,
    //         // audios: processedAudios,
    //         timestamp: new Date(),
    //         parentId,
    //       });

    //       const product = await Product.findById(productId);
    //       const formattedTimestamp = getFormattedTimestamp(new Date());

    //       io.to(recipientFound.socketId).emit("newListChat", {
    //         discussionsMap: {
    //           productId: productId,
    //           userId: sender,
    //           lastMessage: content,
    //         },
    //         productName: product?.name || "Produit inconnu",
    //         productImages: product?.images.map((image) => image.path) || [],
    //         userName:
    //           senderUser?.username || senderUser?.companyName || "Utilisateur inconnu",
    //         userImage:
    //           senderUser?.profileImagePath || "/images/defaultUserProfil.jpg",
    //         lastMessageTime: formattedTimestamp,
    //         productId: productId,
    //         userId: sender,
    //         parentId,
    //       });

    //       const unreadMessages = await Message.find({
    //         recipient: recipient,
    //         unread: true,
    //       });
    //       io.to(recipientFound.socketId).emit("updateNotif", {
    //         number: unreadMessages.length,
    //         allInfo: unreadMessages,
    //         room: roomNameGlobal,
    //         infoUser: senderUser,
    //       });
    //     }

    //     // Retourner le message sauvegardé au client émetteur
    //     // callback({ success: true, data: savedMessage });
    //   } catch (error) {
    //     console.error("Erreur lors du traitement du message :", error);
    //     callback({
    //       success: false,
    //       error: "Erreur lors du traitement du message.",
    //     });
    //   }
    // });

    socket.on("sendMessage", async (data, callback) => {
      const sender =
        socket.request.session.user?._id || socket.request.session.vendor?._id;

      const { recipient, content, images, productId, audios, parentId } = data;
      console.log("parentId", parentId);
      // Vérifier si l'un des utilisateurs est dans la liste noire de l'autre
      const senderUser =
        (await User.findById(sender)) || (await Vendor.findById(sender));

      const recipientUser =
        (await User.findById(recipient)) || (await Vendor.findById(recipient));

      if (!senderUser || !recipientUser) {
        return callback({
          success: false,
          error: "Utilisateur introuvable.",
        });
      }

      const isSenderBlocked = recipientUser.listNoir.some(
        (blockedUser) => blockedUser.userId.toString() === sender
      );
      const isRecipientBlocked = senderUser.listNoir.some(
        (blockedUser) => blockedUser.userId.toString() === recipient
      );

      if (isSenderBlocked || isRecipientBlocked) {
        return callback({
          success: false,
          error: "communication break",
        });
      }

      try {
        // Chemin du sous-dossier pour enregistrer les audios
        const audioUploadDir = path.join(uploadDirMessage, "audios");
        if (!fs.existsSync(audioUploadDir)) {
          fs.mkdirSync(audioUploadDir, { recursive: true }); // Crée le dossier si inexistant
        }

        // console.log('images', images)
        // Traiter les images
        // Traitement des images et upload sur S3
        const processedImages = images
          ? await Promise.all(
              images.map(async (imageBuffer, index) => {
                const processedImageBuffer = await sharp(imageBuffer)
                  .resize({ width: 320, height: 280 })
                  .jpeg({ quality: 80 })
                  .toBuffer();

                const filename = `messages/images/${Date.now()}_${index}.jpg`;
                const fileUrl = await uploadFileToS3(
                  processedImageBuffer,
                  filename,
                  "image/jpeg"
                );

                if (!fileUrl) {
                  throw new Error("Échec de l'upload S3 pour l'image.");
                }

                return {
                  path: fileUrl, // URL retournée par `uploadFileToS3`
                  contentType: "image/jpeg",
                };
              })
            )
          : [];

        // Traiter les audios uniquement si audios est défini et non vide
        //console.log("audios.isTrusted:", audios[0]);
        let processedAudios;
        if (!audios[0]?.isTrusted) {
          processedAudios =
            audios && audios.length > 0
              ? await Promise.all(
                  audios.map(async (audioBuffer, index) => {
                    const MAX_SIZE_MB = 10; // Taille maximale en mégaoctets
                    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

                    if (audioBuffer.length > MAX_SIZE_BYTES) {
                      throw new Error(
                        `L'audio dépasse la taille maximale de ${MAX_SIZE_MB} Mo.`
                      );
                    }

                    const filename = `audio_${Date.now()}_${index}.mp3`;
                    const filePath = path.join(audioUploadDir, filename);

                    fs.writeFileSync(filePath, audioBuffer);

                    return {
                      path: `/messages/audios/${filename}`, // Chemin accessible pour le client
                      contentType: "audio/mpeg",
                    };
                  })
                )
              : []; // Si aucun audio, retourne un tableau vide
        }

        // Enregistrer le message dans MongoDB
        const newMessage = new Message({
          sender,
          recipient,
          content,
          productId,
          images: processedImages,
          audios: processedAudios,
          timestamp: new Date(),
          parentId,
        });

        const savedMessage = await newMessage.save();

        // Émettre le message à l'utilisateur destinataire
        const recipientFound = onlineUsers.get(recipient);
        const senderFound = onlineUsers.get(sender);

        if (recipientFound) {
          io.to(roomNameGlobal).emit("newMessage", {
            sender,
            recipient,
            content,
            productId,
            images: processedImages,
            audios: processedAudios,
            timestamp: new Date(),
            parentId,
          });
        }

        const otherUser = recipient;
        let discussionsMap = {};
        const key = `${productId}-${otherUser}`;
        //console.log(currentUserId, otherUser)
        // if (otherUser == currentUserId) {
        //   console.log("in in")
        //   continue
        // }

        // Si la discussion n'existe pas, initialiser avec le premier message

        discussionsMap = {
          productId: productId,
          userId: otherUser,
          lastMessage: content,
        };

        // Mettre à jour avec le dernier message le plus récent

        const product = await Product.findById(productId);
        const user =
          (await User.findById(sender)) || (await Vendor.findById(sender));

        const formattedTimestamp = getFormattedTimestamp(new Date());

        // Ici les données sont envoyées chez le destinateur du message afin de faire une mise à jour à temps réel de la liste des utilisateurs du chat

        console.log("recipientFound", recipientFound);
        if (recipientFound) {
          io.to(recipientFound.socketId).emit("newListChat", {
            discussionsMap,
            productName: product?.name || "Produit inconnu",
            productImages: product?.images.map((image) => image.path) || [],
            userName:
              user?.username || user?.companyName || "Utilisateur inconnu",
            userImage:
              user?.profileImagePath || "/images/defaultUserProfil.jpg",
            lastMessageTime: formattedTimestamp,
            productId: productId,
            userId: sender,
            parentId,
          });

          const numberNotifAcceuil = await Message.find({
            recipient: recipient, // Destinataire (l'utilisateur connecté)
            unread: true, // Seulement les messages non lus
          });

          io.to(recipientFound.socketId).emit("updateNotif", {
            number: numberNotifAcceuil.length,
            allInfo: numberNotifAcceuil,
            room: roomNameGlobal,
            infoUser: senderUser,
          });
        }

        //console.log(savedMessage);

        // Retourner le message sauvegardé au client émetteur
         callback({ success: true, data: savedMessage });
      } catch (error) {
        console.error("Erreur lors du traitement du message :", error);
        callback({
          success: false,
          error: "Erreur lors du traitement du message.",
        });
      }
    });

    function getFormattedTimestamp(timestamp) {
      const timeDiff = Date.now() - new Date(timestamp).getTime();
      if (timeDiff > 24 * 60 * 60 * 1000) {
        return `${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} jours`;
      }
      return new Date(timestamp).toLocaleTimeString();
    }

    socket.on("loadComments", async (productId) => {
      try {
        // Récupérer les commentaires associés au produit
        let comments = await ProductComment.find({
          productId,
          parentCommentId: null,
        });

        if (comments.length === 0) {
          return socket.emit("commentsLoaded", []); // Envoyer une liste vide s'il n'y a pas de commentaires
        }

        // Mapper les informations des utilisateurs pour chaque commentaire
        const tabComments = await Promise.all(
          comments.map(async (comment) => {
            let userInfo =
              (await User.findById(comment.userId)) ||
              (await Vendor.findById(comment.userId));

            // Vérifier si les informations de l'utilisateur sont trouvées et les ajouter au commentaire
            if (userInfo) {
              comment.username = userInfo.username || userInfo.companyName;
              comment.profileImagePath = userInfo.profileImagePath;
            }

            const replies = await ProductComment.find({
              parentCommentId: comment._id,
            });

            comment.replies = replies.length;

            // Formater la date dans un format lisible (par exemple "dd-MM-yyyy HH:mm")
            comment.formattedDate = format(
              comment.createdAt,
              "dd-MM-yyyy HH:mm"
            );

            return comment;
          })
        );

        // Trier les commentaires par date de création dans l'ordre croissant
        tabComments.sort((a, b) => a.createdAt - b.createdAt);

        socket.emit("commentsLoaded", tabComments);
      } catch (error) {
        console.error("Erreur lors du chargement des commentaires:", error);
      }
    });

    // Enregistrement d'un nouveau commentaire
    socket.on("newComment", async (ObjectProductComment) => {
      let userId = "";
      let profileImagePath = "";
      let username = "";

      if (socket.request.session.user) {
        userId = socket.request.session.user;
        const userIdent = await User.findById(userId);
        username = userIdent.username;
        profileImagePath = userIdent.profileImagePath;
      } else if (socket.request.session.vendor) {
        userId = socket.request.session.vendor;
        const vendorIdent = await Vendor.findById(userId);
        const companyName = vendorIdent.companyName;
        profileImagePath = vendorIdent.profileImagePath;
        username = companyName;
      } else {
        socket.emit("noIdentifier", "noIdentifier");
        return;
      }

      const productId = ObjectProductComment.productId;
      const comment = ObjectProductComment.commentValue;

      // Le reste de votre code

      //   ? socket.request.session.user._id
      //   : socket.request.session.vendor._id;
      //
      try {
        let newComment = await ProductComment.create({
          productId,
          userId,
          comment,
          username,
          profileImagePath,
        });

        // Formater la date dans un format lisible (par exemple "dd-MM-yyyy HH:mm")
        newComment.formattedDate = format(
          newComment.createdAt,
          "dd-MM-yyyy HH:mm"
        );

        io.emit("commentAdded", newComment); // Diffuser le nouveau commentaire à tous les clients
      } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire:", error);
      }
    });

    // Sauvegarder une réponse à un commentaire
    socket.on("replyComment", async (replyData) => {
      try {
        let userId = "";
        let profileImagePath = "";
        let username = "";

        const sessionUser = await getSessionUser();
        if (!sessionUser)
          return socket.emit("noIdentifier", "Utilisateur non identifié"); // Arrête si aucun utilisateur n'est identifié

        userId = sessionUser.userId._id;
        username = sessionUser.username;
        profileImagePath = sessionUser.profileImagePath;

        // Créer la réponse
        const newReply = await ProductComment.create({
          productId: replyData.productId,
          userId,
          comment: replyData.commentValue,
          username,
          profileImagePath,
          parentCommentId: replyData.parentCommentId, // Référence au commentaire parent
        });

        const replies = await ProductComment.find({
          parentCommentId: replyData.parentCommentId,
        });

        newReply.replies = replies.length;

        // Diffuser la réponse à tous les clients
        io.emit("replyAdded", newReply);
      } catch (error) {
        console.error("Erreur lors de la réponse au commentaire:", error);
      }
    });

    socket.on("loadReplies", async (parentCommentId) => {
      try {
        let replies = await ProductComment.find({ parentCommentId }).sort(
          "createdAt"
        );

        // Formater la date dans un format lisible (par exemple "dd-MM-yyyy HH:mm")
        replies = replies.map((replie) => {
          replie.formattedDate = format(replie.createdAt, "dd-MM-yyyy HH:mm");
          return replie;
        });

        replies = await Promise.all(
          replies.map(async (replie) => {
            const nbrComment = await ProductComment.find({
              parentCommentId: replie._id,
            });

            replie.replies = nbrComment.length;
            return replie;
          })
        );

        replies = replies.reverse();

        // Retourner les réponses au client

        const objetParentCommentReplies = { parentCommentId, replies };

        socket.emit("repliesLoaded", objetParentCommentReplies);
      } catch (error) {
        console.error("Erreur lors du chargement des réponses :", error);
      }
    });

    // Récupérer l'utilisateur connecté depuis la session
    const getSessionUser = async () => {
      let userId, username, profileImagePath;

      if (socket.request.session.user) {
        userId = socket.request.session.user;
        const userIdent = await User.findById(userId);
        username = userIdent.username;
        profileImagePath = userIdent.profileImagePath;
      } else if (socket.request.session.vendor) {
        userId = socket.request.session.vendor;
        const vendorIdent = await Vendor.findById(userId);
        username = vendorIdent.companyName;
        profileImagePath = vendorIdent.profileImagePath;
      } else {
        //socket.emit("noIdentifier", "Utilisateur non identifié");
        return null;
      }
      return { userId, username, profileImagePath };
    };

    // Récupérer les likes d'un produit
    socket.on("likedProduct", async (productId) => {
      try {
        const sessionUser = await getSessionUser();
        //if (!sessionUser) return; // Arrête si aucun utilisateur n'est identifié

        const { userId } = sessionUser || "";

        const likeProduct = await likedProduct.findOne({
          productId: productId.productId,
        });
        const copieLikeProduct = likeProduct;

        //console.log("likeProduct out",likeProduct)
        if (!likeProduct) {
          //console.log('productID in : ', productId)
          const newLikedProduct = new likedProduct({
            productId: productId.productId,
            userIdTab: [],
          });
          await newLikedProduct.save();
          console.log(newLikedProduct);
          return socket.emit("likedProductResponse", {
            productId,
            numberlike: 0,
            me: "no",
          });
        }

        let userIdTabVerif;
        if (sessionUser) {
          userIdTabVerif = copieLikeProduct.userIdTab.find((id) => {
            if (id._id.toString() === userId._id.toString()) {
              return true;
            }
          });
        }

        const me = userIdTabVerif ? "yes" : "no";

        socket.emit("likedProductResponse", {
          productId: productId.productId,
          numberlike: copieLikeProduct.userIdTab.length,
          me,
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des likes:", error);
        socket.emit("likedProductResponse", { message: "Erreur serveur" });
      }
    });

    // Mettre à jour les likes d'un produit
    socket.on("updatelikedProduct", async (productId) => {
      try {
        const sessionUser = await getSessionUser();
        if (!sessionUser)
          return socket.emit("noIdentifier", "Utilisateur non identifié"); // Arrête si aucun utilisateur n'est identifié

        const { userId } = sessionUser;

        console.log("productId ", productId);
        const likeProduct = await likedProduct.findOne({
          productId: productId.productId,
        });
        const copieLikeProduct = likeProduct;
        if (!likeProduct) {
          return socket.emit("updateLikeResponse", {
            message: "Produit non trouvé",
          });
        }

        // console.log("likeProduct")
        // console.log(likeProduct)

        let userIdTabVerif = copieLikeProduct.userIdTab.some((id) => {
          // console.log(id._id.toString(), userId._id.toString())
          if (id._id.toString() == userId._id.toString()) {
            return true;
          }
        });
        let me = "";
        // console.log(userIdTabVerif)
        if (userIdTabVerif !== true) {
          // console.log("ID user non trouvé")
          // console.log(userIdTabVerif)
          copieLikeProduct.userIdTab.push(userId);
          me = "yes";
        } else {
          // console.log("ID trouvé")
          // console.log(userIdTabVerif)
          copieLikeProduct.userIdTab = copieLikeProduct.userIdTab.filter(
            (id) => id._id.toString() !== userId._id.toString()
          );
          me = "no";
        }

        // console.log(copieLikeProduct)

        await copieLikeProduct.save();
        io.emit("updateLikeResponse", {
          productId: productId.productId,
          me,
          numberlike: copieLikeProduct.userIdTab.length,
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour des likes:", error);
        socket.emit("updateLikeResponse", { message: "Erreur serveur" });
      }
    });

    //console.log("onlineUsers login", onlineUsers);
    socket.on("userStatus", async (dataId) => {
      if (onlineUsers.has(dataId)) {
        socket.emit("userStatusResp", {
          userId: dataId,
          status: "En ligne",
        });
      } else {
        const user =
          (await User.findById(dataId)) || (await Vendor.findById(dataId));
        const lastSeen = user?.lastSeen;
        socket.emit("userStatusResp", {
          userId: dataId,
          status: "Hors ligne",
          lastSeen,
        });
      }
    });

    socket.on("disconnect", async () => {
      if (session.user?._id || session.vendor?._id) {
        for (let [userId, socketId] of onlineUsers.entries()) {
          if (socketId.socketId === socket.id) {
            onlineUsers.delete(userId);
            console.log("Utilisateur déconnecté :" + userId);

            const user =
              (await User.findById(userId)) || (await Vendor.findById(userId));

            user.lastSeen = format(new Date(), "dd-MM-yyyy HH:mm");

            await user.save();
            break;
          }
        }

        // onlineUsers[session.user._id].lastSeen = new Date();
        // console.log(
        //   `User ${session.user._id} disconnected at ${
        //     onlineUsers[session.user._id].lastSeen
        //   }`
        // );

        // Notifier les autres utilisateurs
        io.emit("userStatus", {
          userId: idUser,
          status: "offline",
          lastSeen: Date.now(),
        });

        // delete onlineUsers[session.user._id];
      }

      console.log("Un utilisateur s'est déconnecté");
    });
  });
};
