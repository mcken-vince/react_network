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

const validateEmail = (email) => {
  if (!email) return null; // Email is optional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const validateBio = (bio) => {
  if (!bio) return null; // Bio is optional
  
  if (bio.length > 500) {
    return 'Bio must be less than 500 characters';
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
  
  // Optional fields
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  const bioError = validateBio(data.bio);
  if (bioError) errors.bio = bioError;
  
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

export const validateProfileUpdate = (data) => {
  const errors = {};
  
  // All fields are optional for profile update
  if (data.firstName !== undefined) {
    const firstNameError = validateRequired(data.firstName, "First name");
    if (firstNameError) errors.firstName = firstNameError;
  }
  
  if (data.lastName !== undefined) {
    const lastNameError = validateRequired(data.lastName, "Last name");
    if (lastNameError) errors.lastName = lastNameError;
  }
  
  if (data.age !== undefined) {
    const ageError = validateAge(data.age);
    if (ageError) errors.age = ageError;
  }
  
  if (data.location !== undefined) {
    const locationError = validateRequired(data.location, "Location");
    if (locationError) errors.location = locationError;
  }
  
  if (data.username !== undefined) {
    const usernameError = validateUsername(data.username);
    if (usernameError) errors.username = usernameError;
  }
  
  // Password is optional for profile update
  if (data.password !== undefined && data.password !== "") {
    const passwordError = validatePassword(data.password, false);
    if (passwordError) errors.password = passwordError;
  }
  
  // Optional fields
  if (data.email !== undefined) {
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
  }
  
  if (data.bio !== undefined) {
    const bioError = validateBio(data.bio);
    if (bioError) errors.bio = bioError;
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: "Validation failed", errors }, data: null };
  }
  
  return { error: null, data };
};
