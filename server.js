// ROUTE 1 : La porte d'entrée (Login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ROUTE 2 : La salle sécurisée (Dashboard)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ROUTE 3 : La vérification des "clés" (API)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Ici, tu définis les accès de l'administrateur
    if (email === "admin@afec.fr" && password === "Afec2026!") {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Identifiants invalides ou licence expirée." });
    }
});