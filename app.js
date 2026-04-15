/* ==========================================================
   1. LOGIQUE D'AUTHENTIFICATION & SIMULATION MAIL
   ========================================================== */

async function authentifier() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Test des identifiants (Admin AFEC + Ton accès perso + Fatima pour test alerte)
    const isAdmin = (email === "admin@afec.fr" && password === "Afec2026!");
    const isMatt = (email === "mattdizair@gmail.com" && password === "@Mathieu47");
    const isFatima = (email === "fatima.douah@afec.fr"); // Fatima peut se connecter pour tester l'alerte

    if (isAdmin || isMatt || isFatima) {
        // Déclenchement du flux de chargement
        document.getElementById('loading-email').innerText = email;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('loading-screen').style.display = 'flex';

        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('dashboard-section').style.display = 'block';
            console.log("Connexion réussie pour : " + email);
            
            // --- DÉCLENCHEMENT DE L'ALERTE CLIENT (NOUVEAU) ---
            verifierEcheanceClient();
        }, 2000);
    } else {
        // Affichage du popup iMessage en cas d'erreur
        const popup = document.getElementById('popup-alerte');
        const message = document.getElementById('message-erreur');
        if (popup && message) {
            message.innerText = "Identifiants incorrects. Veuillez réessayer.";
            popup.style.display = 'flex';
        } else {
            alert("Identifiants incorrects.");
        }
    }
}

// Fonction pour simuler la réception d'une alerte côté client (Position Client)
function verifierEcheanceClient() {
    const currentUserEmail = document.getElementById('email').value;

    // On simule que l'utilisateur Fatima (en rouge) reçoit l'alerte
    if (currentUserEmail === "fatima.douah@afec.fr") {
        setTimeout(() => {
            const notif = document.getElementById('client-notification');
            if (notif) {
                notif.style.display = 'block';
                console.log("ALERTE CLIENT : La licence de " + currentUserEmail + " expire dans 3 jours !");
                
                // Disparition automatique après 8 secondes
                setTimeout(() => { 
                    notif.style.display = 'none'; 
                }, 8000);
            }
        }, 1500); // Apparaît peu après l'arrivée sur le dashboard
    }
}

// Fonction pour simuler l'envoi du lien par mail
function demanderLienAcces() {
    const email = document.getElementById('email').value;
    
    if (!email || !email.includes('@')) {
        alert("Veuillez saisir une adresse mail valide d'abord.");
        return;
    }

    const card = document.querySelector('.login-card');
    const existingNotif = document.querySelector('.mail-sent-notif');
    if (existingNotif) existingNotif.remove(); 

    const notif = document.createElement('div');
    notif.className = 'mail-sent-notif';
    notif.innerText = "Lien de connexion envoyé à " + email;
    card.prepend(notif);

    console.log("Simulation : Mail envoyé à " + email);

    setTimeout(() => {
        alert("Simulation : Vous avez cliqué sur le lien reçu par mail !");
        authentifierViaLien(email);
    }, 3000);
}

function authentifierViaLien(email) {
    document.getElementById('loading-email').innerText = email;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'flex';

    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        
        // On vérifie aussi l'échéance si on passe par le lien mail
        verifierEcheanceClient();
    }, 1500);
}

function fermerAlerte() {
    const popup = document.getElementById('popup-alerte');
    if (popup) popup.style.display = 'none';
}

/* ==========================================================
   2. LOGIQUE DU DASHBOARD (TRI, STATS, DONNÉES)
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('user-table-body');
    const sortSelect = document.getElementById('sort-select');
    const headers = document.querySelectorAll('.sortable');

    const updateStats = () => {
        const countGreen = document.querySelectorAll('.row-green').length;
        const countYellow = document.querySelectorAll('.row-yellow').length;
        const countRed = document.querySelectorAll('.row-red').length;

        if(document.getElementById('count-green')) document.getElementById('count-green').innerText = countGreen;
        if(document.getElementById('count-yellow')) document.getElementById('count-yellow').innerText = countYellow;
        if(document.getElementById('count-red')) document.getElementById('count-red').innerText = countRed;
    };

    function executerTri(critere) {
        if (!tableBody) return;
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            let aCol, bCol;
            switch(critere) {
                case 'nom': aCol = a.cells[2]; bCol = b.cells[2]; break;
                case 'ville': aCol = a.cells[4]; bCol = b.cells[4]; break;
                case 'anciennete': aCol = a.cells[5]; bCol = b.cells[5]; break;
                case 'licence': aCol = a.cells[6]; bCol = b.cells[6]; break;
                case 'statut': 
                    const p = { 'row-red': 1, 'row-yellow': 2, 'row-green': 3 };
                    const classA = a.className.split(' ').find(c => c.startsWith('row-'));
                    const classB = b.className.split(' ').find(c => c.startsWith('row-'));
                    return p[classA] - p[classB];
                default: return 0;
            }

            let valA = aCol ? aCol.innerText.toLowerCase() : "";
            let valB = bCol ? bCol.innerText.toLowerCase() : "";

            if (critere === 'anciennete') {
                return parseInt(valB) - parseInt(valA); 
            }
            return valA.localeCompare(valB);
        });

        tableBody.innerHTML = "";
        rows.forEach(row => tableBody.appendChild(row));
    }

    async function chargerUtilisateurs() {
        if (!tableBody) return;
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error("Erreur réseau");
            
            const utilisateurs = await response.json();
            tableBody.innerHTML = ""; 

            utilisateurs.forEach(user => {
                const row = document.createElement('tr');
                row.className = `row-${user.statut.toLowerCase()}`; 
                
                row.innerHTML = `
                    <td><span class="dot"></span></td>
                    <td><label class="switch-admin"><input type="checkbox" checked><span class="slider-retro round"></span></label></td>
                    <td>${user.nom}</td>
                    <td>${user.email}</td>
                    <td>AFEC France</td>
                    <td>${user.anciennete || "N/A"}</td>
                    <td>${user.message || "WINDOWS 11 PRO"}</td>
                `;
                tableBody.appendChild(row);
            });
            updateStats();
        } catch (err) {
            console.warn("Mode démo : Utilisation des données locales.");
            updateStats();
        }
    }

    if(sortSelect) {
        sortSelect.addEventListener('change', (e) => executerTri(e.target.value));
    }

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const critere = header.getAttribute('data-critere');
            if (critere) {
                executerTri(critere);
                if(sortSelect) sortSelect.value = critere;
            }
        });
    });

    chargerUtilisateurs();
});