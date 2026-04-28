const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

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
        console.error('❌ Erreur de connexion SQL (Vérifie XAMPP) :', err.message);
    } else {
        console.log('✅ Tunnel établi avec MySQL (Base : afec_microsoft)');
    }
});

/* ==========================================================
    2. CONFIGURATION ET MIDDLEWARES
   ========================================================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ==========================================================
    3. ROUTES API (Les Portes de ton application)
   ========================================================== */

/**
 * ROUTE DE CONNEXION : Vérification dans la base MySQL
 * Gère les appels vers /api/login et /login
 */
const handleLogin = (req, res) => {
    const { email, password } = req.body;

    // Requête SQL utilisant "mot_de_passe" pour correspondre à ton phpMyAdmin
    const sql = "SELECT * FROM utilisateurs WHERE mail = ? AND mot_de_passe = ?";
    
    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.error("Erreur SQL:", err);
            return res.status(500).json({ auth: false, message: "Erreur serveur" });
        }

        if (result.length > 0) {
            // ✅ LOGIN RÉUSSI
            console.log(`🔓 Connexion réussie pour : ${email}`);
            res.status(200).json({ 
                auth: true, 
                message: "Bienvenue !", 
                user: result[0] // Renvoie toutes les infos de l'utilisateur
            });
        } else {
            // ❌ ACCÈS REFUSÉ
            console.log(`🚫 Échec de connexion pour : ${email}`);
            res.status(401).json({ auth: false, message: "Identifiants incorrects" });
        }
    });
};

app.post('/api/login', handleLogin);
app.post('/login', handleLogin);

/**
 * ROUTE UTILISATEURS : Lecture du fichier JSON
 * Utilisé pour afficher la liste dans le tableau de bord
 */
const USERS_FILE = path.join(__dirname, 'user.json');

app.get('/api/users', (req, res) => {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            console.error("Fichier user.json absent.");
            return res.status(404).json({ error: "Fichier user.json absent." });
        }
        
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Erreur lors de la lecture des données JSON:", err);
        res.status(500).json({ error: "Erreur lecture données." });
    }
});

/* ==========================================================
    4. LANCEMENT DU SERVEUR
   ========================================================== */
app.listen(PORT, () => {
    console.log(`
    ==================================================
    🚀 SERVEUR AFEC : COMMUTATION FULL-STACK RÉUSSIE
    🌍 URL : http://localhost:${PORT}
    📁 Liaison : MySQL (afec_microsoft) + user.json
    ==================================================
    `);
});