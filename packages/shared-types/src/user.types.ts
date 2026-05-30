export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SALES_MANAGER = 'sales_manager',
  SALES_AGENT = 'sales_agent',
  SITE_ENGINEER = 'site_engineer',
  BUYER = 'buyer',
}

export enum OAuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export interface IUser {
  _id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  phone?: string;
  oauthProvider?: OAuthProvider;
  oauthId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}
