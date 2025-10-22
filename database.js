const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('!!! DATABASE CONNECTION FAILED !!!', err.message);
        throw err; // Crash the app loudly
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            phone TEXT,
            subscription_status TEXT DEFAULT 'free' NOT NULL
        )`, (err) => {
            if (err) console.error("Erro ao criar tabela 'users'", err.message);
        });
    }
});
module.exports = db;