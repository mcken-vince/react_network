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

const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

const validateAge = (age) => {
  const numAge = parseInt(age);
  if (!numAge || numAge < 13 || numAge > 120) {
    return 'Age must be between 13 and 120';
  }
  return null;
};

export const validateSignup = (data) => {
  const errors = {};
  
  const firstNameError = validateRequired(data.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateRequired(data.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  const ageError = validateAge(data.age);
  if (ageError) errors.age = ageError;
  
  const locationError = validateRequired(data.location, 'Location');
  if (locationError) errors.location = locationError;
  
  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
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