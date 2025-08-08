import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/sequelize.js';

class User extends Model {
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    // Ensure timestamp fields are available as camelCase for frontend
    if (values.created_at) {
      values.createdAt = values.created_at;
    }
    if (values.updated_at) {
      values.updatedAt = values.updated_at;
    }
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name',
    validate: {
      notEmpty: {
        msg: 'First name is required'
      }
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name',
    validate: {
      notEmpty: {
        msg: 'Last name is required'
      }
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 1,
        msg: 'Age must be greater than 0'
      },
      isInt: {
        msg: 'Age must be a valid integer'
      }
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Location is required'
      }
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Username already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Username is required'
      },
      len: {
        args: [3, 30],
        msg: 'Username must be between 3 and 30 characters'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password is required'
      },
      len: {
        args: [6],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Bio must be less than 500 characters'
      }
    }
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  },
  indexes: [
    {
      fields: ['username']
    }
  ]
});

// Database operations as static methods
User.findByUsername = async function(username) {
  return this.findOne({ where: { username } });
};

User.findById = async function(id) {
  return this.findByPk(id);
};

User.createUser = async function(userData, transaction) {
  return this.create(userData, { transaction });
};

User.getAllUsers = async function() {
  return this.findAll({
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password'] }
  });
};

User.updateUser = async function(id, userData, transaction) {
  const user = await this.findByPk(id);
  if (!user) {
    return null;
  }
  
  return user.update(userData, { transaction });
};

export default User;
