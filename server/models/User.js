import { User as SequelizeUser } from './sequelize/index.js';
import sequelize from '../config/sequelize.js';

// Re-export the Sequelize User model as default
export default SequelizeUser;

// Database operations with transactions support
export const findUserByUsername = async (username) => {
  try {
    return await SequelizeUser.findByUsername(username);
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    return await SequelizeUser.findById(id);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await SequelizeUser.createUser(userData, transaction);
    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    return await SequelizeUser.getAllUsers();
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await SequelizeUser.updateUser(id, userData, transaction);
    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating user:', error);
    throw error;
  }
};
