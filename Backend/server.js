const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

let dbConnected = false;

/* ==========================================================
    1. CONNEXION À LA BASE DE DONNÉES (MySQL)
   ========================================================== */
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'afec_microsoft'
});

db.connect((err) => {
    if (err) {
        console.log('⚠️ MODE SANS DATABASE : MySQL est inaccessible (Vérifie XAMPP).');
        console.log('☁️ Le serveur utilisera une validation simulée pour le login.');
        dbConnected = false;
    } else {
        console.log('✅ Tunnel établi avec MySQL (Base : afec_microsoft)');
        dbConnected = true;
    }
});

/* ==========================================================
    2. CONFIGURATION ET MIDDLEWARES
   ========================================================== */
// Permet au serveur de lire le format JSON
app.use(express.json());

// DIT AU SERVEUR OÙ TROUVER TES FICHIERS (HTML, CSS, JS)
// Ton dossier doit s'appeler "public" et être dans le dossier "Backend"
app.use(express.static(path.join(__dirname, 'public')));

/* ==========================================================
    3. ROUTES API (Le "Cerveau")
   ========================================================== */

/**
 * LOGIN : Vérifie les accès (Hybride)
 */
const handleLogin = (req, res) => {
    const { email, password } = req.body;

    if (dbConnected) {
        const sql = "SELECT * FROM utilisateurs WHERE mail = ? AND mot_de_passe = ?";
        db.query(sql, [email, password], (err, result) => {
            if (err) {
                console.error("Erreur SQL:", err);
                return res.status(500).json({ auth: false, message: "Erreur serveur" });
            }
            if (result.length > 0) {
                console.log(`🔓 Connexion SQL réussie : ${email}`);
                res.status(200).json({ auth: true, message: "Bienvenue !", user: result[0] });
            } else {
                res.status(401).json({ auth: false, message: "Identifiants incorrects" });
            }
        });
    } else {
        console.log(`☁️ Connexion simulée (Mode Démo) : ${email}`);
        res.status(200).json({ 
            auth: true, 
            message: "Bienvenue (Mode Démo) !", 
            user: { mail: email, nom: "Utilisateur Test" } 
        });
    }
};

app.post('/api/login', handleLogin);
app.post('/login', handleLogin);

/**
 * LISTE UTILISATEURS : Lit le fichier user.json
 */
const USERS_FILE = path.join(__dirname, 'user.json');

app.get('/api/users', (req, res) => {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            return res.status(404).json({ error: "Fichier user.json absent." });
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: "Erreur lecture données." });
    }
});

/* ==========================================================
    4. LANCEMENT DU SERVEUR
   ========================================================== */
app.listen(PORT, () => {
    console.log(`
    ==================================================
    🚀 SERVEUR AFEC : SYSTÈME HYBRIDE ACTIVÉ
    🌍 URL : http://localhost:${PORT}
    📁 Dossier public : Connecté
    📁 Data : MySQL (si dispo) ou JSON (secours)
    ==================================================
    `);
});