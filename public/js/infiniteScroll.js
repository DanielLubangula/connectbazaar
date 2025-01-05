// document.querySelector(".clearImg").style.display = "none";
// // Affiche produit
// //function APiProduct
// /** 
// orgine est un paramètre qui permet de vérifier qui a appelé cette fonction afin de modifier l'affichage
// */
// let scrollInfinite = "";
// const ApiProduct = async (orgine) => {
//   const spinner = document.getElementById("spinner");
//   const productTable = document.getElementById("productTable");

//   // Affiche le spinner pendant le chargement des données
//   spinner.style.display = "block";

//   try {
//     // const response = await fetch("http://192.168.4.14:5000/deliver/apiProduct");
//     const response = await fetch("http://localhost:5000/deliver/apiProduct");

//     if (!response.ok)
//       throw new Error("Erreur lors de la récupération des produits");

//     const products = await response.json();
//     // Masquer le spinner une fois les données prêtes
//     spinner.style.display = "none";

//     if (products.length === 0) {
//       document.querySelector(".information").classList.add("center");
//       document.querySelector(
//         ".information"
//       ).innerHTML = `Vous n'avez publié aucun produit`;

//       console.log(document.querySelector(".afficherPlus"));
//       document.querySelector(".afficherPlus").style.display = "none";
//     } else {
//       document.querySelector(".information").innerHTML = ``;
//       document.querySelector(".afficherPlus").style.display = "block";
//     }

//     // Afficher les produits dans le tableau
//     if (orgine !== "app1") {
//       productTable.innerHTML = "";
//       scrollInfinite = true;
//     }

//     if (products.length === 0){
//       return
//     }

//     document.querySelector(".afficherPlus").innerHTML = "Afficher plus"
//     AfficherProduit(products);
    
//   } catch (error) {
//     console.error(error);
//     spinner.style.display = "none";
//     alert("Erreur lors de la récupération des produits.");
//   }
//   let nextImage = "";
//   /* Caroussel image**/
//   const carousels = document.querySelectorAll(".carousel-container");
//   carousels.forEach((carousel) => {
//     let currentIndex = 0;
//     const images = carousel.querySelectorAll(".carousel-image");
//     const dots = carousel.querySelectorAll(".carousel-dot");
//     const totalImages = images.length;
//     let startX;

//     const showImage = (index) => {
//       images.forEach((img, i) => img.classList.toggle("active", i === index));
//       dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
//     };

//     const nextImage = () => {
//       currentIndex = (currentIndex + 1) % totalImages;
//       showImage(currentIndex);
//     };

//     const prevImage = () => {
//       currentIndex = (currentIndex - 1 + totalImages) % totalImages;
//       showImage(currentIndex);
//     };

//     // Automatic scroll
//     let autoScroll = setInterval(nextImage, 3000); // Change image every 3 seconds

//     // Event listeners for dots
//     dots.forEach((dot) => {
//       dot.addEventListener("click", () => {
//         currentIndex = parseInt(dot.getAttribute("data-index"));
//         showImage(currentIndex);
//         clearInterval(autoScroll); // Reset auto-scroll on manual click
//         autoScroll = setInterval(nextImage, 3000);
//       });
//     });

//     // Swipe functionality for touch screens
//     carousel.addEventListener("touchstart", (event) => {
//       startX = event.touches[0].clientX;
//     });

//     carousel.addEventListener("touchend", (event) => {
//       const endX = event.changedTouches[0].clientX;
//       if (startX - endX > 50) {
//         // Swipe left
//         nextImage();
//       } else if (endX - startX > 50) {
//         // Swipe right
//         prevImage();
//       }
//       clearInterval(autoScroll); // Reset auto-scroll on manual swipe
//       autoScroll = setInterval(nextImage, 3000);
//     });

//     // Event listeners for navigation buttons
//     carousel
//       .querySelector(".carousel-nav.left")
//       .addEventListener("click", () => {
//         prevImage();
//         clearInterval(autoScroll);
//         autoScroll = setInterval(nextImage, 3000);
//       });

//     carousel
//       .querySelector(".carousel-nav.right")
//       .addEventListener("click", () => {
//         nextImage();
//         clearInterval(autoScroll);
//         autoScroll = setInterval(nextImage, 3000);
//       });
//   });
// };

// /* Caroussel image**/

// //function APiProduct

// document.addEventListener("DOMContentLoaded", async () => {
//   ApiProduct("app1");
// });

// // Affiche produit

// //Spinner
// const productForm = document.getElementById("productForm");
// const spinner = document.getElementById("spinnerSend");
// let validation = "";

// document
//   .querySelector(".btnUpload")
//   .addEventListener("click", async (event) => {
//     event.preventDefault();

//     // Affiche le spinner
//     spinner.style.display = "block";
//     document.querySelector(".divForm").style.display = "none";

//     const formData = new FormData();

//     // Récupérer les fichiers choisis (jusqu'à 3)
//     const images = document.querySelector(".imagesInput").files;
//     for (let i = 0; i < images.length && i < 3; i++) {
//       formData.append("images", images[i]); // 'images' est le nom du champ que le serveur attend
//     }

//     // Ajouter d'autres données si nécessaire
//     formData.append("name", document.querySelector(".name").value);
//     formData.append("category", document.querySelector(".category").value);
//     formData.append("price", document.querySelector(".price").value);
//     formData.append("quantity", document.querySelector(".quantity").value);
//     formData.append(
//       "description",
//       document.querySelector(".description").value
//     );

//     try {
//       const response = await fetch("/deliver/productPublieVendor", {
//         method: "POST",
//         body: formData, // Pas de Content-Type nécessaire pour FormData
//       });

//       const result = await response.json();

//       if (response.ok) {
//         console.log("Success:", result);
//         document.querySelector(".name").value = "";
//         document.querySelector(".price").value = "";
//         document.querySelector(".description").value = "";
//         document.querySelector(".category").value = "";
//         document.querySelector(".quantity").value = "";
//         validation = true;

//         // Autres actions, par exemple rediriger l'utilisateur ou réinitialiser le formulaire
//       } else {
//         console.error(
//           "Error:",
//           result.message || "Erreur lors de la soumission"
//         );
//         document.querySelector(".information").innerHTML = result.message;
//         document.querySelector(".information").classList.add("messageError");

//         validation = false;
//       }
//     } catch (error) {
//       console.error("Fetch Error:", error);
//       validation = false;
//     } finally {
//       if (validation) {
//         // Masque le spinner une fois la requête terminée (succès ou erreur)
//         spinner.style.display = "none";
//         document.querySelector(".divForm").style.display = "block";
//         modal.classList.remove("active");
//       } else {
//         spinner.style.display = "none";
//         document.querySelector(".divForm").style.display = "block";
//       }
//     }
//   });

// //Spinner
// // Modal Management
// document.querySelector(".clearImg").addEventListener("click", () => {
//   document.querySelector(".clearImg").style.display = "none";
//   document.getElementById("imagePreview").innerHTML = "";
//   document.querySelector(".imagesInput").value = "";
// });

// const modal = document.getElementById("productModal");

// const cameraModal = document.getElementById("cameraModal");
// const filterModal = document.getElementById("filterModal");
// const addProductBtn = document.getElementById("addProductBtn");

// addProductBtn.addEventListener("click", () => {
//   //document.querySelector(".header").classList.add('zIndex')
//   document.querySelector(".btnUpload").style.display = "block";
//   document.querySelector(".btnEdit").style.display = "none";

//   modal.classList.add("active");
//   document.querySelector(".headerVendor").style.display = "none";
// });

// function closeButton() {
//   document.getElementById("imagePreview").innerHTML = "";
//   document.querySelector(".clearImg").style.display = "none";
//   document.querySelector(".headerVendor").style.display = "block";
//   setTimeout(function () {
//     ApiProduct();
//   }, 2000);
// }

// function closeModal() {
//   document.querySelector(".titreFormh3").innerHTML = "Ajouter un Produit";
//   document.querySelector(".clearImg").style.display = "none";
//   document.querySelector(".imagesInput").value = "";
//   document.getElementById("imagePreview").innerHTML = "";
//   modal.classList.remove("active");
//   document.querySelector(".headerVendor").style.display = "block";
// }

// function openFilterModal() {
//   filterModal.classList.add("active");
// }

// function closeFilterModal() {
//   filterModal.classList.remove("active");
// }

// // Camera Management
// const cameraPreview = document.getElementById("cameraPreview");
// const captureButton = document.getElementById("captureButton");
// let stream = null;

// document
//   .querySelector('label[for="cameraInput"]')
//   .addEventListener("click", (e) => {
//     openCameraPreview();
//   });

// async function openCameraPreview() {
//   try {
//     stream = await navigator.mediaDevices.getUserMedia({
//       video: {
//         facingMode: "environment",
//       },
//     });
//     cameraPreview.srcObject = stream;
//     cameraModal.classList.add("active");
//   } catch (err) {
//     console.error("Error accessing camera:", err);
//     alert(
//       "Impossible d'accéder à la caméra. Veuillez vérifier les permissions."
//     );
//   }
// }

// function closeCameraModal() {
//   if (stream) {
//     stream.getTracks().forEach((track) => track.stop());
//     stream = null;
//   }
//   cameraModal.classList.remove("active");
// }

// captureButton.addEventListener("click", () => {
//   // Check if we already have 3 images
//   if (imagePreview.children.length >= 3) {
//     alert("Vous ne pouvez avoir que 3 images maximum.");
//     closeCameraModal();
//     return;
//   }

//   const canvas = document.createElement("canvas");
//   canvas.width = cameraPreview.videoWidth;
//   canvas.height = cameraPreview.videoHeight;
//   canvas.getContext("2d").drawImage(cameraPreview, 0, 0);

//   const imageUrl = canvas.toDataURL("image/jpeg");

//   // Create preview element
//   const previewContainer = document.createElement("div");
//   previewContainer.className = "relative";

//   const img = document.createElement("img");
//   img.src = imageUrl;
//   img.className = "w-full h-32 object-cover rounded-lg";

//   //const deleteBtn = document.createElement('button');
//   //deleteBtn.className = 'clearInput absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center';
//   //deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
//   //deleteBtn.onclick = function() {
//   //   previewContainer.remove();
//   //};

//   previewContainer.appendChild(img);
//   // {{!-- previewContainer.appendChild(deleteBtn); --}}

//   closeCameraModal();
// });

// // Image preview handling
// const fileInput = document.getElementById("fileInput");
// const cameraInput = document.getElementById("cameraInput");
// const imagePreview = document.getElementById("imagePreview");

// function handleImageUpload(event) {
//   const files = event.target.files;

//   document.querySelector(".clearImg").style.display = "block";
//   // Check if we already have 3 images
//   if (files.length > 3) {
//     document.querySelector(".imagesInput").value = "";
//     closeButton();
//     alert("Vous ne pouvez télécharger que 3 images maximum.");
//     return;
//   }
  
//   // Calculate how many more images we can add
//   //console.log("imagePreview.children.length")
//   //console.log(imagePreview.children.length)
//   const remainingSlots = 3 - imagePreview.children.length;
//   //console.log('remainingSlots')
//   //console.log(remainingSlots)
//   const filesToProcess = Array.from(files).slice(0, 3);
//   //console.log("filesToProcess")
//   //console.log(filesToProcess)
//   for (const file of filesToProcess) {
//     console.log("files", file)
//     imagePreview.innerHTML = "";
//     //console.log("2file")
//     //console.log(file)
//     if (file.type.startsWith("image/")) {
//       const reader = new FileReader();

//       reader.onload = function (e) {
//         // Only add if we haven't reached 3 images yet
//         if (imagePreview.children.length < 3) {
//           const previewContainer = document.createElement("div");
//           previewContainer.className = "relative";
//           const img = document.createElement("img");
//           img.src = e.target.result;
//           img.className = "w-full h-32 object-cover rounded-lg";

//           //const deleteBtn = document.createElement('button');
//           //deleteBtn.className = 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center';
//           //deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
//           //deleteBtn.onclick = function() {
//           //    previewContainer.remove();
//           //};

//           previewContainer.appendChild(img);
//           //{{!-- previewContainer.appendChild(deleteBtn); --}}
//           //console.log('ici')

//           imagePreview.appendChild(previewContainer);
//         }
//       };

//       reader.readAsDataURL(file);
//     }
//   }
// }

// fileInput.addEventListener("change", handleImageUpload);
// cameraInput.addEventListener("change", handleImageUpload);

// // Form Submission
// productForm.addEventListener("submit", (e) => {
//   // Add form submission logic
//   closeModal();
// });

// // Filter Modal Submission
// const filterForm = document.getElementById("filterForm");

// filterForm.addEventListener("submit", (e) => {
//   // Get filter values
//   const formData = new FormData(filterForm);
//   const filters = {
//     category: formData.get("category"),
//     minPrice: formData.get("minPrice"),
//     maxPrice: formData.get("maxPrice"),
//     status: formData.get("status"),
//   };

//   // Apply filters to the product list
//   filterProducts(filters);

//   // Close the modal
//   closeFilterModal();
// });

// function resetFilters() {
//   filterForm.reset();
// }

// function filterProducts(filters) {
//   const rows = document.querySelectorAll("tbody tr");

//   rows.forEach((row) => {
//     let visible = true;

//     // Category filter
//     if (filters.category && row.children[2].textContent !== filters.category) {
//       visible = false;
//     }

//     // Price filter
//     const price = parseFloat(
//       row.children[3].textContent.replace("€", "").trim()
//     );
//     if (filters.minPrice && price < filters.minPrice) {
//       visible = false;
//     }
//     if (filters.maxPrice && price > filters.maxPrice) {
//       visible = false;
//     }

//     // Status filter
//     if (filters.status) {
//       const status = row.children[5].textContent.trim().toLowerCase();
//       if (status !== filters.status) {
//         visible = false;
//       }
//     }

//     // Show/hide row
//     row.style.display = visible ? "" : "none";
//   });
// }

// // Search functionality
// const searchInput = document.getElementById("searchInputProduct");

// searchInput.addEventListener("input", function (e) {
//   const searchTerm = e.target.value.toLowerCase();
//   const rows = document.querySelectorAll("tbody tr");

//   rows.forEach((row) => {
//     const productName = row.children[1].textContent.toLowerCase();
//     const category = row.children[2].textContent.toLowerCase();

//     // Search in product name and category
//     const matches =
//       productName.includes(searchTerm) || category.includes(searchTerm);

//     // Show/hide row based on search
//     row.style.display = matches ? "" : "none";
//   });
// });

// //
// let productToDelete = null;

// function deleteProduct(id) {
//   productToDelete = id;
//   const deleteModal = document.getElementById("deleteModal");
//   deleteModal.classList.add("active");
// }

// function closeDeleteModal() {
//   const deleteModal = document.getElementById("deleteModal");
//   deleteModal.classList.remove("active");
//   productToDelete = null;
// }

// async function confirmDelete() {
//   if (productToDelete) {
//     // Sélectionner la ligne du produit à supprimer
//     const productRow = document.getElementById(`product-${productToDelete}`);
//     const productImage = productRow.querySelector(".product-image");

//     //document.querySelector("#productTable").classList.add("disabled");

//     // Ajouter des styles ternes et afficher le spinner
//     productRow.classList.add("opacity-50"); // Rendre la ligne terne
//     const spinner = document.createElement("div");
//     spinner.classList.add("spinnerDelete");
//     productImage.appendChild(spinner); // Ajouter le spinner au niveau de l'image
//     try {
//       const response = await fetch(`/deliver/api/products/${productToDelete}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//       const result = await response.json();

//       if (response.ok) {
//         console.log("Succès :", result.message);
//         // Mettez à jour l'interface pour retirer le produit de la liste affichée
//         setTimeout(function () {
//           ApiProduct();
//           productRow.remove();
//           document.querySelector("#productTable").classList.remove("disabled");
//         }, 1000);
//       } else {
//         console.error(
//           "Erreur lors de la suppression du produit :",
//           result.message
//         );
//         // Retirer le spinner et restaurer l'opacité si la suppression échoue
//         productRow.classList.remove("opacity-50");
//         spinner.remove();
//         //document.querySelector("#productTable").classList.remove("disabled");
//       }
//     } catch (error) {
//       console.error("Erreur réseau lors de la suppression du produit :", error);
//       productRow.classList.remove("opacity-50");
//       //document.querySelector("#productTable").classList.remove("disabled");
//       spinner.remove();
//     }
//   }
//   closeDeleteModal();
// }

// /**
//  *Modifier les information du produit
//  */
// let idProduct = "";
// function editProduct(productId) {
//   idProduct = productId;
//   document.querySelector(".headerVendor").style.display = "none";
//   // Récupérez les informations du produit à partir de l'élément correspondant
//   const productRow = document.getElementById(`product-${productId}`);
//   let images = productRow.querySelector("td:nth-child(1)").innerHTML;
//   let name = productRow.querySelector("td:nth-child(2)").textContent;
//   let category = productRow.querySelector("td:nth-child(3)").textContent;
//   let price = productRow.querySelector("td:nth-child(4)").textContent.slice(1); // Supprimer le symbole €
//   let quantity = productRow.querySelector("td:nth-child(5)").textContent;

//   document.querySelector(".titreFormh3").innerHTML = "Modifier le produit";

//   const parser = new DOMParser();
//   const doc = parser.parseFromString(images, "text/html");

//   // Sélectionne toutes les balises <img> dans .carousel-images
//   images = doc.querySelectorAll(".carousel-images img");

//   // Affiche les balises <img> récupérées
//   // Affichez le modal
//   document.querySelector(".product-modal").classList.toggle("active");

//   // Remplissez les champs du formulaire
//   // {{!-- document.getElementById('editProductId').value = productId; --}}
//   document.getElementById("name").value = name;
//   document.getElementById("category").value = category;
//   document.getElementById("price").value = price;
//   document.getElementById("quantity").value = quantity;

//   if (document.querySelector(".btnUpload") !== null) {
//     document.querySelector(".btnUpload").style.display = "none";
//     //document.querySelector(".positionAbsolute ").removeChild(document.querySelector('.btnUpload'));
//   }
//   document.querySelector(".btnEdit").style.display = "block";

//   //const button = document.createElement('button')
//   //button.className = "span12px btnEdit bg-indigo-600 text-white px-4 py-2 rounded-lg"
//   //button.innerHTML = "Appliquer"
//   //document.querySelector(".positionAbsolute ").appendChild(button)
//   // Parcours et affichage des images extraites
//   images.forEach((img) => {
//     // Cloner l'image pour pouvoir l'ajouter dans un autre conteneur
//     const imgClone = img.cloneNode(true);
//     // Réinitialiser la classe en une seule classe 'imgEdit'
//     imgClone.className = "imgEdit";
//     imagePreview.appendChild(imgClone);
//   });

//   // Add escape key handler for filter modal
// }
// document.querySelector(".btnEdit").addEventListener("click", async (event) => {
//   const productId = idProduct;
//   if (idProduct === "") {
//     return;
//   }
//   event.preventDefault(); // Empêche le rechargement de la page

//   // Affiche le spinner
//   spinner.style.display = "block";

//   // Cacher la div formulaire
//   document.querySelector(".divForm").style.display = "none";

//   quantity = document.getElementById("quantity").value;
//   price = document.getElementById("price").value;
//   category = document.getElementById("category").value;
//   name = document.getElementById("name").value;

//   const formData = new FormData();

//   formData.append("name", document.getElementById("name").value);
//   formData.append("quantity", document.getElementById("quantity").value);
//   formData.append("price", document.getElementById("price").value);
//   formData.append("category", document.getElementById("category").value);

//   document.getElementById("name").value = "";
//   document.getElementById("quantity").value = "";
//   document.getElementById("price").value = "";
//   document.getElementById("category").value = "";
//   // Ajouter les fichiers

//   const imagesInput = document.querySelector(".imagesInput");
//   for (let i = 0; i < imagesInput.files.length; i++) {
//     formData.append("images", imagesInput.files[i]);
//   }

//   try {
//     // Envoie la requête PUT pour mettre à jour le produit
//     const response = await fetch(`/deliver/api/editProduct/${productId}`, {
//       method: "PUT",
//       body: formData,
//     });

//     const result = await response.json();
//     if (response.ok) {
//       // Actualise la ligne du produit dans le tableau
//       // {{!-- const productRow = document.getElementById(`product-${productId}`);
//       // productRow.querySelector('td:nth-child(2)').textContent = name;
//       // productRow.querySelector('td:nth-child(3)').textContent = category;
//       // productRow.querySelector('td:nth-child(4)').textContent = `€${price}`; --}}

//       console.log(result.message);

//       spinner.style.display = "none";
//       ApiProduct();
//       // Ferme le modal
//       // {{!-- closeEditModal(); --}}
//     } else {
//       console.error("Erreur lors de la mise à jour du produit");
//     }
//   } catch (error) {
//     console.error("Erreur réseau :", error);
//   } finally {
//     // Cacher le spinner
//     spinner.style.display = "none";
//     document.querySelector(".divForm").style.display = "block";
//     document.querySelector(".product-modal").classList.remove("active");
//   }
// });
// //
// //Rechercher un produit
// // Récupère l'input de recherche et le tableau des produits
// //const searchInput = document.getElementById("searchInputProduct");
// const productTable = document.getElementById("productTable");

// // Écoute les événements "input" pour détecter les changements dans le champ de recherche
// searchInput.addEventListener("input", function () {
//   const searchValue = searchInput.value.toLowerCase(); // Convertit le texte de recherche en minuscules

//   // Parcourt chaque ligne du tableau
//   Array.from(productTable.getElementsByTagName("tr")).forEach((row) => {
//     const productName = row.cells[1]?.textContent.toLowerCase(); // Supposons que le nom du produit est dans la deuxième colonne

//     // Vérifie si le nom du produit contient le texte de recherche
//     if (productName && productName.includes(searchValue)) {
//       row.style.display = ""; // Affiche la ligne si elle correspond
//     } else {
//       row.style.display = "none"; // Cache la ligne si elle ne correspond pas
//     }
//   });
// });

// //Filtre de produit
// // Sélection du formulaire de filtre et du tableau des produits

// // Fonction de filtrage des produits
// function applyFilter() {
//   // Récupérer les valeurs des filtres
//   const selectedCategory = document
//     .querySelector(".selectedProduct")
//     .value.toLowerCase();
//   const minPrice = parseFloat(document.querySelector(".minPrice").value) || 0;
//   const maxPrice =
//     parseFloat(document.querySelector(".maxPrice").value) || Infinity;
//   const status = document.querySelector(".statusProduct").value.toLowerCase();

//   // Parcourir chaque ligne du tableau des produits
//   Array.from(productTable.getElementsByTagName("tr")).forEach((row) => {
//     //console.log(row.cells[2]?.textContent.toLowerCase())
//     //console.log(row.cells[3]?.textContent.replace(/[^0-9.-]+/g, ""))
//     //console.log(row.cells[5]?.textContent.toLowerCase().trim())
//     const productCategory = row.cells[2]?.textContent.toLowerCase(); // Supposons que la catégorie est dans la deuxième colonne
//     const productPrice =
//       parseFloat(row.cells[3]?.textContent.replace(/[^0-9.-]+/g, "")) || 0; // Supposons que le prix est dans la troisième colonne
//     const productStatus = row.cells[5]?.textContent.toLowerCase().trim(); // Supposons que le statut est dans la quatrième colonne

//     console.log(selectedCategory, productCategory);
//     // Conditions de filtrage
//     const matchesCategory =
//       selectedCategory === "toutes les catégories" ||
//       productCategory === selectedCategory;
//     const matchesPrice = productPrice >= minPrice && productPrice <= maxPrice;
//     const matchesStatus =
//       status === "tous les status" || productStatus === status;

//     // Afficher ou masquer la ligne en fonction des filtres
//     if (matchesCategory && matchesPrice && matchesStatus) {
//       row.style.display = ""; // Afficher la ligne si elle correspond
//     } else {
//       row.style.display = "none"; // Masquer la ligne si elle ne correspond pas
//     }
//   });
// }

// // Attacher l'événement au bouton "Appliquer"
// document
//   .querySelector(".appliquerFilterBtn")
//   .addEventListener("click", function (event) {
//     event.preventDefault(); // Empêcher le rechargement de la page
//     applyFilter(); // Appliquer le filtre
//     document.getElementById("filterModal").classList.remove("active"); // Fermer la fenêtre modale après application du filtre
//   });

// // Attacher l'événement au bouton "Réinitialiser" pour afficher toutes les lignes
// document.querySelector(".renit").addEventListener("click", function (event) {
//   event.preventDefault(); // Empêcher le rechargement de la page
//   document.querySelector(".selectedProduct").value = "toutes les catégories";
//   document.querySelector(".minPrice").value = "";
//   document.querySelector(".maxPrice").value = "";
//   document.querySelector(".statusProduct").value = "tous les status";
//   applyFilter(); // Réappliquer le filtre pour afficher toutes les lignes
// });
// ///**********************************infinite_Scroll***********************/

// let lastItemId = null;

// function loadMoreItems() {
//   document.getElementById("spinnerCharge").style.display = "block";
//   document.querySelector(".afficherPlus").style.display = "none";
//   console.log("lastItemId : " + lastItemId);
//   fetch("/deliver/api/chargeproduct/" + lastItemId, {
//     method: "POST",
//     headers: {
//       contentType: "application/json",
//     },
//     body: JSON.stringify(lastItemId),
//   })
//     .then((response) => response.json())
//     .then((result) => {
//       console.log(result.products);
//       document.getElementById("spinnerCharge").style.display = "none";
//       document.querySelector(".afficherPlus").style.display = "block";
//       if (result.products.length === 0) {
//         document.querySelector(".afficherPlus").innerHTML = "Plus de produit à afficher";
//       }else{
//          document.querySelector(".afficherPlus").innerHTML = "Afficher plus"
//       }
//       AfficherProduit(result.products);
//     })
//     .catch((error) =>
//       console.log("Erreur lors du chargement des produit : " + error)
//     );
// }

// //document.getElementById('spinnerCharge').style.display = 'none';

// let items = "";
// // Initialisation

// // console.log(items)

// document.querySelector(".afficherPlus").addEventListener("click", function () {
//   items = document.querySelectorAll(".item");
//   if (items.length > 0) {
//     lastItemId = items[items.length - 1].getAttribute("data-id"); //Récupère le dernier ID de l'item
//     console.log(lastItemId);
//     loadMoreItems();
//   }
// });
// ///**********************************infinite_Scroll***********************/
// function AfficherProduit(products) {
//   products.forEach((product) => {
//     const row = document.createElement("tr");

//     row.className = "border-b hover:bg-gray-50";
//     row.className = "item";
//     row.id = `product-${product._id}`;
//     row.setAttribute("data-id", product._id);
//     row.innerHTML = `
// <td class="p-4 product-image">
// <div class="carousel-container">
//     <div class="carousel-images">
//         ${product.images
//           .map(
//             (img, index) => `
//             <img src="${img.path}" alt="${
//               product.name
//             }" class="carousel-image ${
//               index === 0 ? "active" : ""
//             }" data-index="${index}">
//         `
//           )
//           .join("")}
//     </div>
//     <button class="carousel-nav left" >&#10094;</button>
//     <button class="carousel-nav right">&#10095;</button>
//     <div class="carousel-indicators">
//         ${product.images
//           .map(
//             (img, index) => `
//             <span class="carousel-dot ${
//               index === 0 ? "active" : ""
//             }" data-index="${index}"></span>
//         `
//           )
//           .join("")}
//     </div>
// </div>
// </td>
// <td class="p-4">${product.name}</td>
// <td class="p-4">${product.category}</td>
// <td class="p-4">€${product.price}</td>
// <td class="p-4">${product.quantity}</td>
// <td class="p-4">
// <span class="bg-green-100 text-green-800 px-2 py-1 rounded">Actif</span>
// </td>
// <td class="p-4">
// <div class="flex space-x-2">
//     <button class="text-blue-600 hover:text-blue-800" onclick="editProduct('${
//       product._id
//     }')">
//         <i class="fas fa-edit"></i>
//     </button>
//     <button class="text-red-600 hover:text-red-800" onclick="deleteProduct('${
//       product._id
//     }')">
//         <i class="fas fa-trash"></i>
//     </button>
// </div>
// </td>
// `;

//     productTable.appendChild(row);
//   });
// }
// //**********************************************************

// window.addEventListener("keydown", (e) => {
//   if (e.key === "Escape" && filterModal.classList.contains("active")) {
//     closeFilterModal();
//   }
//   if (e.key === "Escape" && cameraModal.classList.contains("active")) {
//     closeCameraModal();
//   }
// });
