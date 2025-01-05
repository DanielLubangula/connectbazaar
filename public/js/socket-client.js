const productForm = document.getElementById("productForm");
console.log(productForm)
// Enregistrer l'utilisateur (exemple d'ID utilisateur)
console.log(document.querySelector('.idVendor'))
let userId = document.querySelector('.idVendor').value;
console.log("vendor : "+ userId)
socket.emit("register", userId);

// Intercepter la soumission du formulaire
productForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Empêche la soumission par défaut
    const formData = new FormData(productForm);

    // Afficher le spinner
    socket.emit("showSpinner");
    document.getElementById("spinner").style.display = "block";

    // Envoyer le formulaire via Fetch API
    fetch(productForm.action, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            socket.emit("uploadSuccess", data.message);
            alert("Image uploadée avec succès !");
        } else {
            socket.emit("uploadError", data.message);
            alert("Erreur lors de l'upload !");
        }
    })
    .catch(error => {
        socket.emit("uploadError", "Erreur lors de l'upload !");
        alert("Erreur lors de l'upload !");
    })
    .finally(() => {
        // Masquer le spinner
        socket.emit("hideSpinner");
        document.getElementById("spinner").style.display = "none";
    });
});
