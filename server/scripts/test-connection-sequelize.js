import sequelize from '../config/sequelize.js';
import { User, Connection } from '../models/sequelize/index.js';

const testConnection = async () => {
  try {
    // Test basic connection
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test model definitions
    console.log('\n📊 Testing model definitions...');
    console.log('User model:', User.name);
    console.log('User table name:', User.tableName);
    console.log('User associations:', Object.keys(User.associations));
    
    console.log('\nConnection model:', Connection.name);
    console.log('Connection table name:', Connection.tableName);
    console.log('Connection associations:', Object.keys(Connection.associations));
    
    // Test if tables exist
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    console.log('\n📋 Existing tables:', tables);
    
    // Test a simple query
    const userCount = await User.count();
    const connectionCount = await Connection.count();
    
    console.log(`\n📈 Statistics:`);
    console.log(`- Total users: ${userCount}`);
    console.log(`- Total connections: ${connectionCount}`);
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

testConnection();
