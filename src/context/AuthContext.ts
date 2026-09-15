import { createContext } from "react";
import type {
  LoginCredentials,
  ProfileUpdateData,
  SignupData,
  User,
} from "../types";

export type SignupInput = Omit<SignupData, "age"> & {
  age: number | string;
  confirmPassword?: string;
};

export interface AuthResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  handleSignup: (values: SignupInput) => Promise<AuthResult>;
  handleLogin: (credentials: LoginCredentials) => Promise<AuthResult>;
  handleLogout: () => void;
  updateUserProfile: (
    userId: number,
    data: ProfileUpdateData,
  ) => Promise<AuthResult>;
  refetchCurrentUser: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
