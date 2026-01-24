require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const password = 'admin123'; // Default admin password
    const hash = bcrypt.hashSync(password, 8);
    
    // Check if admin exists
    const check = await db.query("SELECT * FROM users WHERE username = 'admin'");
    
    if (check.rows.length > 0) {
      // Update existing admin
      await db.query("UPDATE users SET password_hash = $1 WHERE username = 'admin'", [hash]);
      console.log('Admin password updated to default: admin123');
    } else {
      // Create new admin
      await db.query("INSERT INTO users (username, password_hash, role) VALUES ('admin', $1, 'admin')", [hash]);
      console.log('Admin user created with password: admin123');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();
