/* ==========================================================
   1. AUTHENTIFICATION (ADMIN DIRECT + LIAISON MYSQL)
   ========================================================== */

async function authentifier() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    // --- ÉTAPE A : VÉRIFICATION PRIORITAIRE (ADMIN MAÎTRE DANS LE CODE) ---
    const masterAdminEmail = "admin@afec.fr";
    const masterAdminPass = "Afec2026!";

    if (email === masterAdminEmail && password === masterAdminPass) {
        console.log("✅ Accès Admin Maître autorisé (Code direct)");
        lancerAnimationConnexion(email);
        return; 
    }

    // --- ÉTAPE B : VÉRIFICATION MYSQL (AUTRES UTILISATEURS) ---
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.auth) {
            console.log("✅ Accès autorisé par MySQL pour : " + email);
            lancerAnimationConnexion(email);
        } else {
            // ❌ Appel du message personnalisé "Intrus"
            afficherErreurLogin(data.message || "Identifiants invalides.");
        }
    } catch (error) {
        console.error("Erreur de connexion au serveur :", error);
        afficherErreurLogin("Le serveur ne répond pas. Vérifiez que node server.js est lancé.");
    }
}

// Fonction centrale pour l'animation de succès
function lancerAnimationConnexion(email) {
    document.getElementById('loading-email').innerText = email;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'flex';

    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        
        // On charge les données réelles et on vérifie les alertes
        chargerUtilisateurs();
        verifierEcheanceClient();
    }, 2000);
}

// ✅ FONCTION FUSIONNÉE : Alerte personnalisée pour les intrus
function afficherErreurLogin(msg) {
    const popup = document.getElementById('popup-alerte');
    const message = document.getElementById('message-erreur');
    
    if (popup && message) {
        // Design du message pour l'intrus
        message.innerHTML = `
            <span style="color: #ff3b30; font-weight: bold; font-size: 1.2em;">⚠️ ALERTE INTRUSION</span><br><br>
            Désolé, vous n'êtes pas le bienvenu ici.<br>
            Vos identifiants sont invalides ou vous n'avez pas les droits d'accès au système AFEC.
        `;
        popup.style.display = 'flex';
    } else {
        alert("🚨 STOP : Accès refusé. " + msg);
    }
}

/* ==========================================================
   2. LOGIQUE DU DASHBOARD (APPEL API & AFFICHAGE DYNAMIQUE)
   ========================================================== */

async function chargerUtilisateurs() {
    const tableBody = document.getElementById('user-table-body');
    if (!tableBody) return;

    try {
        const response = await fetch('/api/users'); 
        if (!response.ok) throw new Error("Erreur réseau");
        
        const utilisateurs = await response.json();
        tableBody.innerHTML = ""; 

        utilisateurs.forEach(user => {
            const row = document.createElement('tr');
            const statutLower = user.statut ? user.statut.toLowerCase() : "green";
            row.className = `row-${statutLower}`; 

            // --- CALCUL DE LA BARRE DE TEMPS (Cycle 5 ans) ---
            const dureeTotale = 5; 
            const ansUtilises = parseInt(user.anciennete) || 0;
            const ansRestants = dureeTotale - ansUtilises;
            let pourcentage = (ansRestants / dureeTotale) * 100;
            if (pourcentage < 0) pourcentage = 0;

            let couleurBarre = "#34c759"; // Vert
            if (ansRestants <= 2) couleurBarre = "#ff9500"; // Orange
            if (ansRestants <= 1) couleurBarre = "#ff3b30"; // Rouge
            
            row.innerHTML = `
                <td><span class="dot" style="background:${couleurBarre}"></span></td>
                <td>
                    <label class="switch-admin">
                        <input type="checkbox" checked>
                        <span class="slider-retro round"></span>
                    </label>
                </td>
                <td>${user.nom}</td>
                <td>${user.email}</td>
                <td>${user.ville || "AFEC France"}</td>
                <td>
                    <div class="time-bar-container" style="background:#eee; width:80px; height:8px; border-radius:5px;">
                        <div class="time-bar-fill" style="width: ${pourcentage}%; background: ${couleurBarre}; height:100%; border-radius:5px;"></div>
                    </div>
                    <span class="time-label" style="font-size:10px;">${ansRestants > 0 ? ansRestants : 0} AN(S) RESTANT(S)</span>
                </td>
                <td>${user.licence || "WIN 11 PRO"}</td>
            `;
            tableBody.appendChild(row);
        });
        updateStats();
    } catch (error) {
        console.error("Erreur de chargement des données :", error);
    }
}

/* ==========================================================
   3. GESTION DES NOTIFICATIONS ET STATISTIQUES
   ========================================================== */

function verifierEcheanceClient() {
    const currentUserEmail = document.getElementById('email').value;
    if (currentUserEmail === "fatima.douah@afec.fr") {
        setTimeout(() => {
            const notif = document.getElementById('client-notification');
            if (notif) {
                notif.style.display = 'block';
                setTimeout(() => { notif.style.display = 'none'; }, 8000);
            }
        }, 1500);
    }
}

function demanderLienAcces() {
    alert("Simulation : Lien de secours envoyé sur votre boîte mail AFEC.");
}

document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sort-select');
    const headers = document.querySelectorAll('.sortable');

    window.updateStats = () => {
        const countGreen = document.querySelectorAll('.row-green').length;
        const countYellow = document.querySelectorAll('.row-yellow').length;
        const countRed = document.querySelectorAll('.row-red').length;

        if(document.getElementById('count-green')) document.getElementById('count-green').innerText = countGreen;
        if(document.getElementById('count-yellow')) document.getElementById('count-yellow').innerText = countYellow;
        if(document.getElementById('count-red')) document.getElementById('count-red').innerText = countRed;
    };

    function executerTri(critere) {
        const tableBody = document.getElementById('user-table-body');
        if (!tableBody) return;
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            let aCol, bCol;
            switch(critere) {
                case 'nom': aCol = a.cells[2]; bCol = b.cells[2]; break;
                case 'ville': aCol = a.cells[4]; bCol = b.cells[4]; break;
                case 'anciennete': aCol = a.cells[5]; bCol = b.cells[5]; break;
                default: return 0;
            }
            let valA = aCol ? aCol.innerText.toLowerCase() : "";
            let valB = bCol ? bCol.innerText.toLowerCase() : "";
            return valA.localeCompare(valB);
        });

        tableBody.innerHTML = "";
        rows.forEach(row => tableBody.appendChild(row));
    }

    if(sortSelect) sortSelect.addEventListener('change', (e) => executerTri(e.target.value));

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const critere = header.getAttribute('data-critere');
            if (critere) executerTri(critere);
        });
    });
});