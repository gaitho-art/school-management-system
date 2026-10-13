require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Adding full_name column to teachers table...');
    await conn.query('ALTER TABLE teachers ADD COLUMN full_name VARCHAR(150) NOT NULL AFTER teacher_number');
    console.log('✅ Column added successfully!');
    
    await conn.end();
  } catch (err) {
    if (err.errno === 1060) {
      console.log('Column already exists. You are good to go!');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
})();