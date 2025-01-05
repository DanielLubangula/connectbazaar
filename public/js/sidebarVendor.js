        // Gestion du menu mobile
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        function toggleMenu() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        menuToggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        // Gestion des notifications
        document.addEventListener('DOMContentLoaded', function() {
            const notificationBell = document.querySelector('.fa-bell');
            // notificationBell.addEventListener('click', function() {
            //     alert('Notifications:\n- Nouvelle commande reçue\n- Avis client en attente\n- Stock faible sur 2 produits');
            // });
        });

        // Ajustement du sidebar pour les écrans mobiles
        function handleResize() {
            if (window.innerWidth >= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }

        window.addEventListener('resize', handleResize);