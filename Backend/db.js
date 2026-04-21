const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'afec_microsoft'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion SQL :', err);
        return;
    }
    console.log('✅ Connecté à la base MySQL afec_microsoft');
});

module.exports = db;