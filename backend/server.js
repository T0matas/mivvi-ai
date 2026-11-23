const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mivvi_db'
};

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Mivvi Backend is running!', status: 'online' });
});

// SYNC User (Create if not exists)
app.post('/api/users/sync', async (req, res) => {
    const { uid, username, language } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM users WHERE uid = ?', [uid]);

        if (rows.length === 0) {
            // Create New User
            await connection.execute(
                'INSERT INTO users (uid, username, language, xp, gems, level) VALUES (?, ?, ?, 0, 0, 1)',
                [uid, username || 'Explorer', language || 'pt-BR']
            );
            console.log(`User created: ${uid} (${username})`);
            res.json({ status: 'created' });
        } else {
            // User exists, UPDATE their details (username/language)
            await connection.execute(
                'UPDATE users SET username = ?, language = ? WHERE uid = ?',
                [username || 'Explorer', language || 'pt-BR', uid]
            );
            console.log(`User updated: ${uid} -> ${username}`);
            res.json({ status: 'updated' });
        }
        await connection.end();
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ADD FRIEND by Username
app.post('/api/friends/add', async (req, res) => {
    const { uid, friendName } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1. Get Requester ID
        const [users] = await connection.execute('SELECT id FROM users WHERE uid = ?', [uid]);
        if (users.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = users[0].id;

        // 2. Find Friend by Username
        const [friends] = await connection.execute('SELECT id FROM users WHERE username = ?', [friendName]);
        if (friends.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Friend not found' });
        }
        const friendId = friends[0].id;

        if (userId === friendId) {
            await connection.end();
            return res.status(400).json({ error: 'Cannot add yourself' });
        }

        // 3. Check if relationship exists
        const [existing] = await connection.execute(
            'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [userId, friendId, friendId, userId]
        );

        if (existing.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'Friendship already exists or pending' });
        }

        // 4. Create Friendship (Auto-accept for simplicity in this demo, or pending)
        // For this demo, let's just insert it for the requester. 
        // Real apps would start as 'pending'. We'll insert 'accepted' for immediate gratification demo.
        await connection.execute(
            'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
            [userId, friendId, 'accepted']
        );
        // Also insert the reverse relationship so both see each other
        await connection.execute(
            'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
            [friendId, userId, 'accepted']
        );

        await connection.end();
        res.json({ status: 'added', friendName });

    } catch (error) {
        console.error('Add Friend Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET Friends for a User
app.get('/api/friends/:uid', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Find user ID from UID
        const [users] = await connection.execute('SELECT id FROM users WHERE uid = ?', [req.params.uid]);

        if (users.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = users[0].id;

        const [rows] = await connection.execute(
            `SELECT u.username FROM friends f
             JOIN users u ON f.friend_id = u.id
             WHERE f.user_id = ? AND f.status = 'accepted'`,
            [userId]
        );
        await connection.end();
        res.json({ friends: rows.map(r => r.username) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at:`);
    console.log(`- Local:   http://localhost:${port}`);
    console.log(`- Network: http://192.168.1.9:${port} (Use this for mobile)`);
});
