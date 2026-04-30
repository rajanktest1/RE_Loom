import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole, OAuthProvider } from '@realestate/shared-types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BUYER,
    },
    phone: {
      type: String,
      trim: true,
    },
    oauthProvider: {
      type: String,
      enum: Object.values(OAuthProvider),
    },
    oauthId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ oauthProvider: 1, oauthId: 1 });

export const User = mongoose.model<IUserDocument>('User', UserSchema);
