import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React app build directory
// Adjust path to go up one level from 'server' to 'dist'
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// API Routes
app.get('/api/status', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 as val');
        res.json({
            status: 'success',
            message: 'Backend connected to MySQL successfully',
            dbResponse: rows[0]
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to connect to database',
            error: error.message
        });
    }
});

// Example endpoint
app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SHOW TABLES');
        res.json({ tables: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Catch-all handler for any request that doesn't match an API route
// Sends back the React index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port} and accessible via LAN`);
});
