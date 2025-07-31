import { createFileRoute, Navigate } from "@tanstack/react-router";
import SignupForm from "../components/forms/SignupForm";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export const Route = createFileRoute("/signup")({
  component: SignupRoute,
});

function SignupRoute() {
  const { user, isLoading, handleSignup } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return <SignupForm onSignup={handleSignup} />;
}
