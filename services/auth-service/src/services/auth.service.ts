import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IAuthTokens, ITokenPayload, UserRole, OAuthProvider } from '@realestate/shared-types';
import { AppError } from '@realestate/shared-utils';
import { User, IUserDocument } from '../models/user.model';
import { RefreshToken } from '../models/refresh-token.model';

const SALT_ROUNDS = 12;

export class AuthService {
  private get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw AppError.internal('JWT_SECRET not configured');
    return secret;
  }

  private get jwtRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw AppError.internal('JWT_REFRESH_SECRET not configured');
    return secret;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
  }): Promise<IAuthTokens> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw AppError.conflict('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await User.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || UserRole.BUYER,
      phone: data.phone,
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<IAuthTokens> {
    const user = await User.findOne({ email, isActive: true });
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw AppError.unauthorized('Invalid email or password');
    }

    user.lastLogin = new Date();
    await user.save();

    return this.generateTokens(user);
  }

  async refreshToken(token: string): Promise<IAuthTokens> {
    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      throw AppError.unauthorized('Refresh token expired');
    }

    let payload: ITokenPayload;
    try {
      payload = jwt.verify(token, this.jwtRefreshSecret) as ITokenPayload;
    } catch {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      throw AppError.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User not found or inactive');
    }

    // Delete old refresh token (rotation)
    await RefreshToken.deleteOne({ _id: storedToken._id });

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
  }

  async findOrCreateOAuthUser(profile: {
    email: string;
    name: string;
    provider: 'google' | 'microsoft';
    providerId: string;
  }): Promise<IAuthTokens> {
    let user = await User.findOne({
      oauthProvider: profile.provider,
      oauthId: profile.providerId,
    });

    if (!user) {
      // Check if email already exists
      user = await User.findOne({ email: profile.email });
      if (user) {
        // Link OAuth to existing account
        user.oauthProvider = profile.provider as OAuthProvider;
        user.oauthId = profile.providerId;
        await user.save();
      } else {
        user = await User.create({
          email: profile.email,
          name: profile.name,
          oauthProvider: profile.provider,
          oauthId: profile.providerId,
          role: UserRole.BUYER,
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    return this.generateTokens(user);
  }

  private async generateTokens(user: IUserDocument): Promise<IAuthTokens> {
    const payload: ITokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessOpts: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string as any,
    };
    const accessToken = jwt.sign(payload, this.jwtSecret, accessOpts);

    const refreshOpts: SignOptions = {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string as any,
    };
    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, refreshOpts);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user._id.toString(),
      token: refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
