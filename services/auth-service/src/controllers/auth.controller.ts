import { Request, Response } from 'express';
import { asyncHandler, AppError } from '@realestate/shared-utils';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw AppError.badRequest('Validation failed', errors);
  }

  const tokens = await authService.register(validation.data);

  res.status(201).json({
    success: true,
    data: tokens,
    message: 'User registered successfully',
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw AppError.badRequest('Validation failed', errors);
  }

  const tokens = await authService.login(validation.data.email, validation.data.password);

  res.json({
    success: true,
    data: tokens,
    message: 'Login successful',
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const validation = refreshTokenSchema.safeParse(req.body);
  if (!validation.success) {
    throw AppError.badRequest('Refresh token is required');
  }

  const tokens = await authService.refreshToken(validation.data.refreshToken);

  res.json({
    success: true,
    data: tokens,
    message: 'Token refreshed successfully',
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
