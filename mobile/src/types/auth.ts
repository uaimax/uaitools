/**
 * Tipos relacionados à autenticação
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
  is_superuser: boolean;
  is_staff: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  access: string; // JWT access token
}


