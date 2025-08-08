import { exec } from 'child_process';
import { promisify } from 'util';
import sequelize from '../config/sequelize.js';

const execAsync = promisify(exec);

const dropDatabase = async () => {
  try {
    console.log('⚠️  WARNING: This will drop all tables in the database!');
    console.log('Proceeding in 3 seconds... Press Ctrl+C to cancel.');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run migration rollback
    console.log('Rolling back all migrations...');
    const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate:undo:all');
    
    if (stderr) {
      console.error('Rollback warnings:', stderr);
    }
    
    console.log('Rollback output:', stdout);
    
    // Additionally drop all tables (in case there are any not managed by migrations)
    await sequelize.drop();
    
    console.log('✅ Database dropped successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error dropping database:', error);
    process.exit(1);
  }
};

dropDatabase();
