/**
 * Authentication validation utilities
 */

const validateUsername = (username) => {
  if (!username || !username.trim()) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};

const validatePassword = (password, isRequired = true) => {
  if (!password && isRequired) {
    return 'Password is required';
  }
  if (password && password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateLogin = (data) => {
  const errors = {};
  
  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};

export { validateUsername, validatePassword };
