/* ==========================================================
   VARIABLES DE STOCK (RECYCLAGE)
   ========================================================== */
let stockRecyclage = ["AFEC-W11-9999", "AFEC-W11-8888", "AFEC-W11-7777"];

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
   2. LOGIQUE DU DASHBOARD & STATS
   ========================================================== */

let mailEnCours = ""; 

function majChiffresCles() {
    const lignes = document.querySelectorAll('#corps-tableau-rh tr');
    const green = document.querySelectorAll('.row-green').length;
    const red = document.querySelectorAll('.row-red').length;
    
    const totalEl = document.getElementById('total-licences');
    const greenEl = document.getElementById('count-green');
    const redEl = document.getElementById('count-red');

    if(totalEl) totalEl.innerText = lignes.length;
    if(greenEl) greenEl.innerText = green;
    if(redEl) redEl.innerText = red;
}

function confirmerSuppression(nomEmploye, licenceEmploye) {
    const confirmation = confirm(`❗ ATTENTION : Voulez-vous vraiment recycler la licence de ${nomEmploye} ?\nCette action est irréversible.`);
    
    if (confirmation) {
        // RÉCUPÉRATION DE LA LICENCE DANS LE STOCK
        if(licenceEmploye && licenceEmploye !== "NON OBTENUE" && licenceEmploye !== "undefined") {
            stockRecyclage.push(licenceEmploye);
            console.log(`♻️ Stock mis à jour : ${licenceEmploye} ajouté.`);
            alert(`La licence ${licenceEmploye} a été remise dans le stock de recyclage.`);
        }
        
        alert(`♻️ Recyclage réussi : ${nomEmploye} a été retiré du système.`);
        // Simuler la suppression visuelle
        chargerUtilisateurs(); 
        majChiffresCles();
    }
}

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

/* ==========================================================
   3. AJOUT ET CHARGEMENT (GESTION RECYCLAGE DIRECT)
   ========================================================== */

function ajouterUtilisateur() {
    const nom = document.getElementById('new-nom').value;
    const email = document.getElementById('new-email').value;
    const ville = document.getElementById('new-ville').value;
    const statut = document.getElementById('new-statut').value;

    if(nom === "" || email === "") {
        alert("Veuillez remplir au moins le nom et l'email");
        return;
    }

    let licenceAttribuee = "";

    // LOGIQUE DE RECYCLAGE DIRECT
    if (stockRecyclage.length > 0) {
        licenceAttribuee = stockRecyclage.shift(); 
        console.log(`♻️ Recyclage : Licence ${licenceAttribuee} réattribuée.`);
    } else {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        licenceAttribuee = `AFEC-NEW-${randomId}`;
        console.log(`✨ Nouvelle licence générée : ${licenceAttribuee}`);
    }

    const tableBody = document.getElementById('corps-tableau-rh');
    const couleurBarre = statut === "Red" ? "#ff3b30" : (statut === "Yellow" ? "#ff9500" : "#34c759");
    
    const row = document.createElement('tr');
    row.className = `row-${statut.toLowerCase()}`; 

    row.innerHTML = `
        <td><span class="dot" style="background:${couleurBarre}"></span></td>
        <td>
            <button onclick="ouvrirBoiteMail('${email}', '${nom}')" class="btn-action">✉️ Alerter</button>
            <button onclick="confirmerSuppression('${nom}', '${licenceAttribuee}')" class="btn-action btn-delete" style="background:#ff3b30; color:white; border:none; padding:5px; border-radius:5px; margin-left:5px;">🗑️ Recycler</button>
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
        <td>${licenceAttribuee}</td>
    `;
    
    tableBody.insertBefore(row, tableBody.firstChild);
    
    document.getElementById('new-nom').value = "";
    document.getElementById('new-email').value = "";
    document.getElementById('new-ville').value = "";
    
    majChiffresCles();
    alert(`Succès ! Licence utilisée : ${licenceAttribuee} (${stockRecyclage.length} restantes en stock)`);
}

async function chargerUtilisateurs() {
    const tableBody = document.getElementById('corps-tableau-rh');
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
                    <button onclick="confirmerSuppression('${user.nom}', '${user.licence}')" class="btn-action btn-delete" style="background:#ff3b30; color:white; border:none; padding:5px; border-radius:5px; margin-left:5px;">🗑️ Recycler</button>
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
        
        majChiffresCles();
        
    } catch (error) {
        console.error("Erreur de chargement :", error);
    }
}

/* ==========================================================
   4. NOTIFICATIONS ET FONCTIONS COMPLÉMENTAIRES
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
    // Initialisation éventuelle
});