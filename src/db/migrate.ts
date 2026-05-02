import pool from "./pool";

const migrate = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');  // Start migration transaction

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOL DEFAULT FALSE;
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) UNIQUE;
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');  // End migration transaction and save permanently

    console.log("Migration complete");
  } catch (err) {
    try {
      await client.query('ROLLBACK');   // Undo transaction because of error
    } catch (err) {
      console.error("Database connection failed, unable to rollback migration:", err);
    }
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
