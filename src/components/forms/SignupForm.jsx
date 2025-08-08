import AuthCard from "./common/AuthCard";
import FormField from "./common/FormField";
import ErrorBanner from "./common/ErrorBanner";
import AuthModeSwitch from "./common/AuthModeSwitch";
import { Button, Grid, Stack } from "../atoms";
import { useFormState } from "../../hooks/useFormState";
import { validateSignupForm } from "../../utils/validation";
import { useNavigate } from "@tanstack/react-router";

const initialFormData = {
  firstName: "",
  lastName: "",
  age: "",
  location: "",
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  bio: "",
};

function SignupForm({ onSignup }) {
  const navigate = useNavigate();
  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setErrors,
    resetForm,
  } = useFormState(initialFormData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateSignupForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await onSignup(formData);
    if (!result.success) {
      setErrors({ general: result.message });
    }
    setIsSubmitting(false);
  };

  const handleSwitchMode = () => {
    resetForm();
    navigate({ to: "/login" });
  };

  return (
    <AuthCard
      title="Join SocialConnect"
      subtitle="Create your account to get started"
    >
      <ErrorBanner message={errors.general} />

      <form onSubmit={handleSubmit}>
        <Stack spacing="medium">
          <Grid cols={1} mdCols={2}>
            <FormField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              error={errors.firstName}
            />

            <FormField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              error={errors.lastName}
            />
          </Grid>

          <Grid cols={1} mdCols={2}>
            <FormField
              label="Age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Your age"
              min="13"
              max="120"
              error={errors.age}
            />

            <FormField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Country"
              error={errors.location}
            />
          </Grid>

          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a unique username"
            error={errors.username}
          />

          <FormField
            label="Email (Optional)"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            error={errors.email}
          />

          <FormField
            label="Bio (Optional)"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us a bit about yourself (max 500 characters)"
            multiline
            rows={3}
            error={errors.bio}
            helperText={`${formData.bio.length}/500 characters`}
          />

          <FormField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password (min 6 characters)"
            error={errors.password}
          />

          <FormField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Creating Account..."
          >
            Create Account
          </Button>
        </Stack>
      </form>

      <AuthModeSwitch isLoginMode={false} onSwitch={handleSwitchMode} />
    </AuthCard>
  );
}

export default SignupForm;
