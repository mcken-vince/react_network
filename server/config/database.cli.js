// Connection settings for sequelize-cli (migrations/seeders) ONLY.
// The application uses config/database.ts. Keep the two in sync.
// Stays JS: sequelize-cli cannot load TypeScript.
import dotenv from 'dotenv';
dotenv.config();

const common = {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: false,
};

export default {
  development: {
    ...common,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'react_network',
    port: parseInt(process.env.DB_PORT || '5433', 10),
  },
  test: {
    ...common,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME_TEST || 'react_network_test',
    port: parseInt(process.env.DB_PORT || '5433', 10),
  },
  production: {
    ...common,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  },
};