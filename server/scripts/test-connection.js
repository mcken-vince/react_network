import pool from '../config/database.js';

const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✓ Database connected successfully');
    console.log('  Current database time:', result.rows[0].current_time);
    
    // Test if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✓ Users table exists');
      
      // Count users
      const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log('  Total users:', countResult.rows[0].count);
    } else {
      console.log('✗ Users table does not exist');
      console.log('  Run "npm run db:setup" to create the database schema');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:');
    console.error('  Error:', error.message);
    console.error('  Make sure PostgreSQL is running on localhost:5433');
    console.error('  Check your .env configuration');
    process.exit(1);
  }
};

testConnection();
