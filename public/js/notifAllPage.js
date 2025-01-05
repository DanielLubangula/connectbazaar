
// const socketMain = io();


// let utilisateurIdMain = ""
// // map2.set("1",{{{json vendor}}})
// // map2.set("2",{{{json user}}})

// utilisateurIdMain = document.querySelector(".idUser")?.value

// console.log("input - ", document.querySelector(".idUser").value," - utilisateur - ",utilisateurIdMain)
// // map2.forEach((value, key) => {
// // if (value){
// // console.log(value)
// // utilisateurIdMain = value._id
// // }
// // })

// // Adapter le nombre de message notification
// socketMain.on("updateNotif", async (data) => {
// console.log(data)

// const allInfo = data.allInfo;
// const infoUser = data.infoUser;

// if (!allInfo || allInfo.length === 0) {
// console.log("Aucune notification disponible.");
// showNotification("Aucune notification", "Pas de nouveaux messages", null, null);
// return;
// }

// // Récupérer la dernière notification
// const latestNotification = allInfo[allInfo.length - 1];

// // Construire le lien de redirection
// const roomParts = data.room.split("-");
// const firstId = roomParts.find((id) => id !== utilisateurIdMain); // Récupère l'ID différent de l'utilisateur actuel
// const lastId = roomParts[roomParts.length - 1]; // Le dernier ID reste inchangé

// const baseURLNotif =
//   window.location.origin.includes('localhost')
//     ? 'http://localhost:5000'
//     : 'https://deliver-jvwl.onrender.com';

// const chatLink = `${baseURLNotif}/deliver/chat/${firstId}/${lastId}`;
// //const chatLink = `http://192.168.43.14:5000/deliver/chat/${firstId}/${lastId}`;

// // Détecter le type de contenu et formater le message
// const contentType = detectContentType(latestNotification);
// const message = formatMessage(latestNotification, contentType);

// // Mettre à jour le compteur de notifications

// // Réajuster le nom au cas où il s'agit d'un acheteur
// if (infoUser.companyName === undefined){
// infoUser.companyName = data.infoUser.username
// }

// // Afficher la notification avec le lien
// showNotification(infoUser.companyName, message, chatLink, infoUser.profileImagePath);
// });


// /************** Début Affichage de notification ***************************/ 
// let notificationTimeoutMain;

// function showNotification(name, message, link, imagePath) {
// const notification = document.getElementById('notification');
// const notificationName = document.getElementById('notification-name');
// const notificationText = document.getElementById('notification-text');
// const notificationTime = document.querySelector('.notification-time');
// const profilePic = document.querySelector('.profile-pic svg');

// // Mettre à jour le contenu de la notification
// notificationName.textContent = name;
// notificationText.textContent = message;
// notificationTime.textContent = "À l'instant";

// // Afficher l'image de profil si elle est disponible
// if (imagePath) {
// console.log('.profile-pic', document.querySelector('.profile-pic'))
// //profilePic.style.display = "none";
// notification.querySelector('.profile-pic').innerHTML = `<img src="${imagePath}" alt="${name}" />`;
// } else {
// profilePic.style.display = "block";
// }

// // Ajouter le lien autour de la notification
// if (link) {
// notification.onclick = () => {
// window.location.href = link;
// };
// notification.style.cursor = "pointer";
// } else {
// notification.onclick = null;
// notification.style.cursor = "default";
// }

// // Afficher la notification
// notification.classList.add('show');

// // Masquer la notification après 10 secondes
// if (notificationTimeoutMain) {
// clearTimeout(notificationTimeoutMain);
// }
// notificationTimeoutMain = setTimeout(() => {
// hideNotification();
// }, 10000);
// }

// function hideNotification() {
// const notification = document.getElementById('notification');
// notification.classList.remove('show');

// // Clear timeout
// if (notificationTimeoutMain) {
// clearTimeout(notificationTimeoutMain);
// }
// }

// // Détection du type de contenu
// function detectContentType(notification) {
// if (notification.content) return "text";
// if (notification.images && notification.images.length > 0) return "image";
// if (notification.audios && notification.audios.length > 0) return "audio";
// return "unknown";
// }

// // Formatage du message
// function formatMessage(notification, type) {
// switch (type) {
// case "text":
// return notification.content;
// case "image":
// return "Une image a été envoyée.";
// case "audio":
// return "Un message audio a été envoyé.";
// default:
// return "Notification inconnue.";
// }
// }
// /************** Fin Affichage de notification ***************************/ 
