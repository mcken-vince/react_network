import pool from '../config/database.js';

const dropDatabase = async () => {
  try {
    console.log('WARNING: This will delete all data!');
    console.log('Dropping database schema...');
    
    // Drop the trigger first
    await pool.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users;');
    
    // Drop the function
    await pool.query('DROP FUNCTION IF EXISTS update_updated_at_column();');
    
    // Drop the users table
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    
    console.log('✓ Database schema dropped successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping database:', error);
    process.exit(1);
  }
};

// Only run if called directly
if (process.argv[2] === '--confirm') {
  dropDatabase();
} else {
  console.log('To confirm database drop, run: npm run db:drop -- --confirm');
  process.exit(1);
}
