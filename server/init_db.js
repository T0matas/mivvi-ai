import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: '', // Default XAMPP password is empty
        multipleStatements: true
    };

    console.log('Connecting to MySQL...');
    let connection;

    try {
        connection = await mysql.createConnection(config);
        console.log('Connected to MySQL server.');

        const sqlPath = path.join(__dirname, 'setup_db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running setup_db.sql...');
        await connection.query(sql);
        console.log('Database `beardo_db` and tables created successfully!');

    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
