const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express(); // <--- C'EST CETTE LIGNE QUI RÉPARE L'ERREUR !
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

// Middlewares
app.use(express.json());
app.use(express.static('.')); 

// --- ROUTES ---

// Page d'accueil (Sert ton fichier index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API : Récupérer les utilisateurs
app.get('/api/users', (req, res) => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: "Impossible de lire users.json" });
    }
});

// API : Ajouter un utilisateur
app.post('/api/users', (req, res) => {
    try {
        const newUser = req.body;
        const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        
        newUser.id = Date.now();
        data.push(newUser);
        
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
        res.status(201).json({ success: true, user: newUser });
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`
    =============================================
    ✅ SERVEUR AFEC OPÉRATIONNEL
    🌍 URL : http://localhost:${PORT}
    =============================================
    `);
});
