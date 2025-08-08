import { exec } from 'child_process';
import { promisify } from 'util';
import sequelize from '../config/sequelize.js';

const execAsync = promisify(exec);

const setupDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Run migrations
    console.log('Running migrations...');
    const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate');
    
    if (stderr) {
      console.error('Migration warnings:', stderr);
    }
    
    console.log('Migration output:', stdout);
    console.log('✅ Database setup completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
};

setupDatabase();
