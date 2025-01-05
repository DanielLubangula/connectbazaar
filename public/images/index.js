    // Message Erreur
    if (document.querySelector('.msgUpdateerr')){
        if (document.querySelector('.msgUpdateerr').innerHTML){
          const menuLiens = document.querySelectorAll('.profile-menu a');
          menuLiens.forEach(link => {
          menuLiens.forEach(l => l.classList.remove('active'));
          document.querySelector('.securite').classList.add('active');
            
            const targetId = document.querySelector('.securite').getAttribute('href').slice(1);
            document.querySelectorAll('.profile-content > div').forEach(div => {
              div.style.display = div.id === targetId ? 'block' : 'none';
            });
      })
      }
      }
      // Fin Message Erreur
      let succesUpdatePassword = ""
      // Message 
      if ({{{json succesUpdatePassword}}} === "Mot de passe modifié avec succès"){
        document.querySelector(".message span").innerHTML = "Mot de passe modifié avec succès"
        document.querySelector('.message').style.top = "50px"
  
        setTimeout(function (){
          document.querySelector('.message').style.top = ""
        }, 5000)     
      }
  
        //enleve notification de successUpdatePAssword
      document.querySelector(".enlevenotif").addEventListener('click', function(){
        document.querySelector('.message').style.top = ""
      })
      // Message 
      document.addEventListener('DOMContentLoaded', function() {
        const profileForm = document.getElementById('profile-form');
        const profilePicture = document.getElementById('profile-picture');
        const profilePictureInput = document.getElementById('profile-picture-input');
        const imagePreviewOverlay = document.getElementById('image-preview-overlay');
        const previewImage = document.getElementById('preview-image');
        const confirmImageButton = document.getElementById('confirm-image');
        const cancelImageButton = document.getElementById('cancel-image');
        
        profileForm.addEventListener('submit', function(e) {
          // Simuler la sauvegarde des données
        });
        
        // Gestion de la navigation dans le menu du profil
        const menuLinks = document.querySelectorAll('.profile-menu a');
        menuLinks.forEach(link => {
          link.addEventListener('click', function(e) {
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('href').slice(1);
            document.querySelectorAll('.profile-content > div').forEach(div => {
              div.style.display = div.id === targetId ? 'block' : 'none';
            });
          });
        });
  
        // Gestion du changement de photo de profil
        profilePicture.addEventListener('click', function() {
          profilePictureInput.click();
        });
  
        profilePictureInput.addEventListener('change', function(e) {
          if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
              previewImage.src = e.target.result;
              imagePreviewOverlay.style.display = 'flex';
            }
            
            reader.readAsDataURL(e.target.files[0]);
          }
        });
  
        confirmImageButton.addEventListener('click', function() {
          console.log(document.querySelector("#profile-picture-input").value)
          profilePicture.src = previewImage.src;
          imagePreviewOverlay.style.display = 'none';
        });
  
        cancelImageButton.addEventListener('click', function() {
          imagePreviewOverlay.style.display = 'none';
          profilePictureInput.value = '';
        });
      });
      // préference ***************************************************
      // Gestion des catégories
          document.querySelectorAll('.category-item').forEach(item => {
              item.addEventListener('click', () => {
                  item.classList.toggle('selected');
              });
          });
  
          // Gestion des tags diététiques
          document.querySelectorAll('.dietary-tag').forEach(tag => {
              tag.addEventListener('click', () => {
                  tag.classList.toggle('selected');
              });
          });
  
          // Gestion du bouton de sauvegarde
          document.querySelector('.save-btn').addEventListener('click', function() {
              this.textContent = 'Préférences sauvegardées !';
              this.style.backgroundColor = '#4CAF50';
              
              setTimeout(() => {
                  this.textContent = 'Enregistrer mes préférences';
                  this.style.backgroundColor = '#81c7bc';
              }, 2000);
          });
  
          // Gestion du range de prix
          const priceRange = document.getElementById('priceRange');
          priceRange.addEventListener('input', function() {
              const value = this.value;
              // Vous pouvez ajouter ici une logique pour afficher le prix sélectionné
          });