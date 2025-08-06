import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

class User {
  constructor({ id, first_name, firstName, last_name, lastName, age, location, username, password, created_at, updated_at }) {
    this.id = id;
    this.firstName = firstName || first_name;
    this.lastName = lastName || last_name;
    this.age = parseInt(age);
    this.location = location;
    this.username = username;
    this.password = password;
    this.createdAt = created_at || new Date();
    this.updatedAt = updated_at || new Date();
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      age: this.age,
      location: this.location,
      username: this.username,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Database operations
export const findUserByUsername = async (username) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  const client = await pool.connect();
  
  try {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const result = await client.query(
      `INSERT INTO users (first_name, last_name, age, location, username, password) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        userData.firstName,
        userData.lastName,
        userData.age,
        userData.location,
        userData.username,
        hashedPassword
      ]
    );
    
    return new User(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getAllUsers = async () => {
  try {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
    
    return result.rows.map(row => {
      const user = new User(row);
      return user.toJSON();
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  const client = await pool.connect();
  
  try {
    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (userData.firstName !== undefined) {
      fields.push(`first_name = $${paramCount}`);
      values.push(userData.firstName);
      paramCount++;
    }
    
    if (userData.lastName !== undefined) {
      fields.push(`last_name = $${paramCount}`);
      values.push(userData.lastName);
      paramCount++;
    }
    
    if (userData.age !== undefined) {
      fields.push(`age = $${paramCount}`);
      values.push(userData.age);
      paramCount++;
    }
    
    if (userData.location !== undefined) {
      fields.push(`location = $${paramCount}`);
      values.push(userData.location);
      paramCount++;
    }
    
    if (userData.username !== undefined) {
      fields.push(`username = $${paramCount}`);
      values.push(userData.username);
      paramCount++;
    }
    
    if (userData.password !== undefined) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      fields.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }
    
    // Always update the updated_at timestamp
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;
    
    // Add the user ID as the last parameter
    values.push(id);
    
    if (fields.length === 1) { // Only updated_at was added
      throw new Error('No fields to update');
    }
    
    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return null; // User not found
    }
    
    return new User(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default User;
