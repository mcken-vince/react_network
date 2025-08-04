import bcrypt from 'bcryptjs';

class User {
  constructor({ firstName, lastName, age, location, username, password }) {
    this.id = Date.now() + Math.random();
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = parseInt(age);
    this.location = location;
    this.username = username;
    this.password = password; // Will be hashed
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  toJSON() {
    const { password: _password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

// In-memory storage (replace with real database in production)
export const users = [];

export const findUserByUsername = (username) => {
  return users.find(user => user.username === username);
};

export const findUserById = (id) => {
  return users.find(user => user.id === id);
};

export const createUser = async (userData) => {
  const user = new User(userData);
  await user.hashPassword();
  users.push(user);
  return user;
};

export const getAllUsers = () => {
  return users.map(user => user.toJSON());
};

export default User;