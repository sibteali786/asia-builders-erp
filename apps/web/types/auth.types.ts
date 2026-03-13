export type UserRole = "OWNER" | "ACCOUNTANT" | "REVIEWER";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Shape of POST /auth/login and POST /auth/register response
export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Shape of POST /auth/login request body
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}
