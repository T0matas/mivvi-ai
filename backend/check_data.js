const mysql = require('mysql2/promise');

async function checkData() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'mivvi_db'
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('--- Connecting to mivvi_db ---');

        // Check Users
        const [users] = await connection.execute('SELECT * FROM users');
        console.log('\n=== USERS ===');
        console.table(users);

        // Check Friends
        const [friends] = await connection.execute('SELECT * FROM friends');
        console.log('\n=== FRIENDS ===');
        console.table(friends);

        // Check Progress
        const [progress] = await connection.execute('SELECT * FROM user_progress');
        console.log('\n=== USER PROGRESS ===');
        console.table(progress);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkData();
