const mysql = require('mysql2/promise');

async function initDatabase() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '', // Default XAMPP password is empty
    };

    try {
        // 1. Create Connection to MySQL Server
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL server.');

        // 2. Create Database
        await connection.query('CREATE DATABASE IF NOT EXISTS mivvi_db');
        console.log('Database mivvi_db checked/created.');
        await connection.end();

        // 3. Connect to the new Database
        const db = await mysql.createConnection({ ...dbConfig, database: 'mivvi_db' });

        // 4. Create Tables
        const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255),
        language VARCHAR(10) DEFAULT 'pt-BR',
        xp INT DEFAULT 0,
        gems INT DEFAULT 0,
        streak INT DEFAULT 0,
        level INT DEFAULT 1,
        hearts INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        const createFriendsTable = `
      CREATE TABLE IF NOT EXISTS friends (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        friend_id INT,
        status ENUM('pending', 'accepted') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (friend_id) REFERENCES users(id)
      )
    `;

        const createProgressTable = `
      CREATE TABLE IF NOT EXISTS user_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        lesson_id INT,
        stars INT DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

        await db.query(createUsersTable);
        console.log('Table "users" checked/created.');

        await db.query(createFriendsTable);
        console.log('Table "friends" checked/created.');

        await db.query(createProgressTable);
        console.log('Table "user_progress" checked/created.');

        // 5. Seed Initial User (Optional)
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', ['Explorador']);
        if (rows.length === 0) {
            await db.query(`
            INSERT INTO users (uid, username, xp, gems, streak, level)
            VALUES (?, ?, ?, ?, ?, ?)
        `, ['user-123', 'Explorador', 1250, 50, 12, 5]);
            console.log('Initial user "Explorador" created.');
        }

        console.log('Database initialization complete!');
        await db.end();

    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDatabase();
