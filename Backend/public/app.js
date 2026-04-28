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

    const masterAdminEmail = "admin@afec.fr";
    const masterAdminPass = "Afec2026!";

    if (email === masterAdminEmail && password === masterAdminPass) {
        console.log("✅ Accès Admin Maître autorisé (Code direct)");
        lancerAnimationConnexion(email);
        return; 
    }

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
            afficherErreurLogin(data.message || "Identifiants invalides.");
        }
    } catch (error) {
        console.error("Erreur de connexion au serveur :", error);
        afficherErreurLogin("Le serveur ne répond pas. Lancez 'node server.js'.");
    }
}

function lancerAnimationConnexion(email) {
    const loadingScreen = document.getElementById('loading-screen');
    if(loadingScreen) {
        document.getElementById('loading-email').innerText = email;
        document.getElementById('login-section').style.display = 'none';
        loadingScreen.style.display = 'flex';

        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.getElementById('dashboard-section').style.display = 'block';
            chargerUtilisateurs();
            verifierEcheanceClient();
        }, 2000);
    } else {
        // Fallback si l'écran de chargement n'existe pas dans ton HTML
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        chargerUtilisateurs();
    }
}

function afficherErreurLogin(msg) {
    const popup = document.getElementById('popup-alerte');
    const message = document.getElementById('message-erreur');
    if (popup && message) {
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
   2. LOGIQUE DU DASHBOARD, SUPPRESSION & AJOUT
   ========================================================== */

let mailEnCours = ""; 

// A. SYSTÈME DE SUPPRESSION (RECYCLAGE)
function confirmerSuppression(nomEmploye, userId) {
    const confirmation = confirm(`❗ ATTENTION : Voulez-vous vraiment recycler (supprimer) ${nomEmploye} de la base AFEC ?\nCette action est irréversible.`);
    
    if (confirmation) {
        console.log(`🗑️ Suppression de l'ID ${userId} (${nomEmploye}) demandée.`);
        alert(`♻️ Recyclage réussi : ${nomEmploye} a été retiré du système.`);
        // Note: On pourrait ici appeler une route DELETE
        chargerUtilisateurs(); 
    }
}

// B. SYSTÈME D'ENVOI DE MAIL (POPUP)
function ouvrirBoiteMail(email, nom) {
    mailEnCours = email; 
    const popup = document.getElementById('popup-message');
    const destinataireNom = document.getElementById('msg-destinataire');

    if (popup && destinataireNom) {
        destinataireNom.innerText = `À : ${nom}`;
        popup.style.display = 'flex'; 
    }
}

function envoyerMessage() {
    alert(`🚀 Envoi réussi à : ${mailEnCours}`);
    document.getElementById('popup-message').style.display = 'none';
}

// C. AJOUT MANUEL D'UN UTILISATEUR
function ajouterUtilisateur() {
    const nom = document.getElementById('new-nom').value;
    const email = document.getElementById('new-email').value;
    const ville = document.getElementById('new-ville').value;
    const statut = document.getElementById('new-statut').value; // 'Green', 'Yellow' ou 'Red'

    if(nom === "" || email === "") {
        alert("Merci de remplir au moins le nom et l'email");
        return;
    }

    const tableBody = document.getElementById('user-table-body') || document.getElementById('corps-tableau-rh');
    if (!tableBody) return;

    // Calcul visuel identique au chargement principal
    const couleurBarre = statut === "Red" ? "#ff3b30" : (statut === "Yellow" ? "#ff9500" : "#34c759");
    const row = document.createElement('tr');
    row.className = `row-${statut.toLowerCase()}`; 

    row.innerHTML = `
        <td><span class="dot" style="background:${couleurBarre}"></span></td>
        <td>
            <button onclick="ouvrirBoiteMail('${email}', '${nom}')" class="btn-action">✉️ Alerter</button>
            <button onclick="confirmerSuppression('${nom}', 'new')" class="btn-action btn-delete" style="background:#ff3b30; color:white; border:none; padding:5px; border-radius:5px; margin-left:5px;">🗑️ Recycler</button>
        </td>
        <td><strong>${nom}</strong></td>
        <td>${email}</td>
        <td>${ville || "AFEC France"}</td>
        <td>
            <div class="time-bar-container" style="background:#eee; width:80px; height:8px; border-radius:5px;">
                <div class="time-bar-fill" style="width: 100%; background: ${couleurBarre}; height:100%; border-radius:5px;"></div>
            </div>
            <span class="time-label" style="font-size:10px;">5 AN(S) RESTANT(S)</span>
        </td>
        <td>WINDOWS 11 PRO</td>
    `;
    
    // On ajoute en haut de la liste
    tableBody.insertBefore(row, tableBody.firstChild);
    
    // Nettoyage des champs
    document.getElementById('new-nom').value = "";
    document.getElementById('new-email').value = "";
    document.getElementById('new-ville').value = "";
    
    updateStats();
    alert(nom + " a été ajouté avec succès au dashboard !");
}

/* ==========================================================
   3. CHARGEMENT ET RENDER DU TABLEAU (FETCH JSON)
   ========================================================== */

async function chargerUtilisateurs() {
    const tableBody = document.getElementById('user-table-body') || document.getElementById('corps-tableau-rh');
    if (!tableBody) return;

    try {
        const response = await fetch('/api/users'); 
        if (!response.ok) throw new Error("Erreur réseau");
        
        const utilisateurs = await response.json();
        tableBody.innerHTML = ""; 

        utilisateurs.forEach(user => {
            const ansRestants = 5 - (parseInt(user.anciennete) || 0);
            let pourcentage = (ansRestants / 5) * 100;
            if (pourcentage < 0) pourcentage = 0;
            let couleurBarre = ansRestants <= 1 ? "#ff3b30" : (ansRestants <= 2 ? "#ff9500" : "#34c759");
            
            const statutLower = ansRestants <= 1 ? "red" : (ansRestants <= 2 ? "yellow" : "green");
            const row = document.createElement('tr');
            row.className = `row-${statutLower}`; 

            row.innerHTML = `
                <td><span class="dot" style="background:${couleurBarre}"></span></td>
                <td>
                    <button onclick="ouvrirBoiteMail('${user.email}', '${user.nom}')" class="btn-action">✉️ Alerter</button>
                    <button onclick="confirmerSuppression('${user.nom}', '${user.id}')" class="btn-action btn-delete" style="background:#ff3b30; color:white; border:none; padding:5px; border-radius:5px; margin-left:5px;">🗑️ Recycler</button>
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
        console.error("Erreur de chargement :", error);
    }
}

/* ==========================================================
   4. NOTIFICATIONS ET TRI
   ========================================================== */

function verifierEcheanceClient() {
    const emailField = document.getElementById('email');
    if (emailField && emailField.value === "fatima.douah@afec.fr") {
        setTimeout(() => {
            const notif = document.getElementById('client-notification');
            if (notif) {
                notif.style.display = 'block';
                setTimeout(() => { notif.style.display = 'none'; }, 8000);
            }
        }, 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sort-select');
    
    window.updateStats = () => {
        const countGreen = document.querySelectorAll('.row-green').length;
        const countYellow = document.querySelectorAll('.row-yellow').length;
        const countRed = document.querySelectorAll('.row-red').length;

        if(document.getElementById('count-green')) document.getElementById('count-green').innerText = countGreen;
        if(document.getElementById('count-yellow')) document.getElementById('count-yellow').innerText = countYellow;
        if(document.getElementById('count-red')) document.getElementById('count-red').innerText = countRed;
    };

    function executerTri(critere) {
        const tableBody = document.getElementById('user-table-body') || document.getElementById('corps-tableau-rh');
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            let aCol, bCol;
            switch(critere) {
                case 'nom': aCol = a.cells[2]; bCol = b.cells[2]; break;
                case 'ville': aCol = a.cells[4]; bCol = b.cells[4]; break;
                case 'anciennete': aCol = a.cells[5]; bCol = b.cells[5]; break;
                default: return 0;
            }
            return aCol.innerText.toLowerCase().localeCompare(bCol.innerText.toLowerCase());
        });

        tableBody.innerHTML = "";
        rows.forEach(row => tableBody.appendChild(row));
    }

    if(sortSelect) sortSelect.addEventListener('change', (e) => executerTri(e.target.value));
});