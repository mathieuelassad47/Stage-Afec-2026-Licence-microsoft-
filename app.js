require('dotenv').config();
const express = require('express');
const msal = require('@azure/msal-node');
const axios = require('axios');
const mysql = require('mysql2');
const path = require('path'); 

const app = express();
const port = 3000;

app.use(express.static('public')); 

// --- 1. CONFIGURATION SQL ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'afec_licences'
});

// --- 2. LOGIQUE D'AUTOMATISATION (Ton "Cerveau" de vendredi) ---
const VERSION_SUPPORT_MINIMALE = 2602; 

function calculerStatutAutomatique(userGraph) {
    const DATE_AUJOURDHUI = new Date();
    // On récupère la date d'activité ou on met une date par défaut si vide
    const derniereActivite = userGraph.lastSignInDateTime ? new Date(userGraph.lastSignInDateTime) : new Date('2024-01-01');
    
    const joursInactifs = (DATE_AUJOURDHUI - derniereActivite) / (1000 * 60 * 60 * 24);
    
    // Note : Pour le build, Microsoft Graph le renvoie souvent dans l'objet 'deviceDetail'
    // Ici on simule une valeur si elle n'existe pas dans ton tenant de test
    const buildVersion = userGraph.officeBuild || 2500; 

    // RÈGLE ROUGE : Sécurité
    if (buildVersion < VERSION_SUPPORT_MINIMALE) {
        return { code: "ROUGE", label: "Danger : Version obsolète" };
    }
    // RÈGLE ORANGE : Recyclage
    if (joursInactifs > 30) {
        return { code: "ORANGE", label: `Recyclable : ${Math.floor(joursInactifs)} jours d'inactivité` };
    }
    // RÈGLE VERTE : OK
    return { code: "VERT", label: "Licence optimisée" };
}

// --- 3. CONFIGURATION MICROSOFT ---
const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET,
    }
};
const cca = new msal.ConfidentialClientApplication(msalConfig);

// --- 4. LES ROUTES ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/users', async (req, res) => {
    try {
        const tokenRequest = { scopes: ['https://graph.microsoft.com/.default'] };
        const authResponse = await cca.acquireTokenByClientCredential(tokenRequest);
        
        // On demande plus de détails à Microsoft (signInActivity pour les dates de connexion)
        const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/users?$select=displayName,mail,id,signInActivity', {
            headers: { Authorization: `Bearer ${authResponse.accessToken}` }
        });

        // --- FUSION : On applique ton calcul à chaque utilisateur reçu ---
        const utilisateursTransformes = graphResponse.data.value.map(user => {
            const analyse = calculerStatutAutomatique(user);
            return {
                nom: user.displayName,
                email: user.mail,
                statut: analyse.code,
                message: analyse.label,
                details: user.signInActivity || "Donnée indisponible"
            };
        });

        res.json(utilisateursTransformes);

    } catch (error) {
        console.error("Erreur Microsoft :", error.message);
        res.status(500).json({ error: "Erreur de connexion Microsoft" });
    }
});

app.listen(port, () => {
    console.log(`🚀 SYSTÈME AFEC AUTOMATISÉ : http://localhost:${port}`);
});