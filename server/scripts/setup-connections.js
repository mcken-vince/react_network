import pool from '../config/database.js';

const createConnectionsTable = async () => {
  const client = await pool.connect();
  
  try {
    // Create connections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS connections (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(requester_id, recipient_id)
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_requester 
      ON connections(requester_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_recipient 
      ON connections(recipient_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_status 
      ON connections(status);
    `);

    // Create a trigger to update the updated_at column
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
      CREATE TRIGGER update_connections_updated_at
        BEFORE UPDATE ON connections
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Connections table created successfully!');
  } catch (error) {
    console.error('❌ Error creating connections table:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createConnectionsTable()
    .then(() => {
      console.log('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

export default createConnectionsTable;
