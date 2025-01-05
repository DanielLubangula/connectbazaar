// const socket = io();

// // Charger les commentaires lorsqu'un utilisateur arrive sur la page d'un produit
// const productId = document.getElementById('productId').value; // Assurez-vous d'avoir l'ID du produit
// socket.emit('loadComments', productId);

// // Recevoir et afficher les commentaires chargés
// socket.on('commentsLoaded', (comments) => {
//     comments.forEach(comment => {
//         displayComment(comment);
//     });
// });

// // Ajouter un nouveau commentaire
// document.getElementById('commentForm').addEventListener('submit', (e) => {
//     e.preventDefault();
//     const commentInput = document.getElementById('comment');
//     const comment = commentInput.value;

//     if (comment.trim()) {
//         socket.emit('newComment', { productId, comment });
//         commentInput.value = '';
//     }
// });

// // Afficher le commentaire ajouté en temps réel
// socket.on('commentAdded', (comment) => {
//     displayComment(comment);
// });

// // Fonction pour afficher un commentaire dans le DOM
// function displayComment(comment) {
//     const commentList = document.getElementById('commentList');
//     const commentElement = document.createElement('div');
//     commentElement.innerHTML = `
//         <div class="comment">
//             <img src="${comment.userId.profileImagePath}" alt="${comment.userId.username}" />
//             <p><strong>${comment.userId.username}</strong>: ${comment.comment}</p>
//         </div>
//     `;
//     commentList.appendChild(commentElement);
// }
