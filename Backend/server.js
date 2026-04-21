const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2'); // Ajout du moteur MySQL

const app = express();
const PORT = 3000;

/* ==========================================================
   CONNEXION À LA BASE DE DONNÉES (La Commutation)
   ========================================================== */
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'afec_microsoft'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erreur de connexion SQL :', err);
    } else {
        console.log('✅ Tunnel établi avec MySQL (Base : afec_microsoft)');
    }
});

/* ==========================================================
   MIDDLEWARES
   ========================================================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ==========================================================
   ROUTES API (Les Portes de ton application)
   ========================================================== */

// 1. ROUTE LOGIN : Accepter ou Refuser les intrus
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Requête SQL pour vérifier dans TA table utilisateurs
    const sql = "SELECT * FROM utilisateurs WHERE mail = ? AND password = ?";
    
    db.query(sql, [email, password], (err, result) => {
        if (err) {
            return res.status(500).json({ auth: false, message: "Erreur serveur" });
        }

        if (result.length > 0) {
            // ✅ LOGIN RÉUSSI
            res.json({ auth: true, message: "Accès Autorisé", user: result[0].mail });
        } else {
            // ❌ ACCÈS REFUSÉ
            res.status(401).json({ auth: false, message: "Identifiants incorrects" });
        }
    });
});

// 2. API : Récupérer la liste (Ancien système user.json conservé par sécurité)
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
   LANCEMENT DU SERVEUR
   ========================================================== */
app.listen(PORT, () => {
    console.log(`
    ==================================================
    🚀 SERVEUR AFEC : COMMUTATION FULL-STACK RÉUSSIE
    🌍 URL : http://localhost:${PORT}
    📁 Liaison : MySQL (afec_microsoft) + JSON
    ==================================================
    `);
});