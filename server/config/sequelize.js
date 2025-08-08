import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import config from './database.js';

dotenv.config();

const env = process.env.NODE_ENV || 'development';

const sequelize = new Sequelize(config[env]);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

export default sequelize;
