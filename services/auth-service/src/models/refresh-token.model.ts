import mongoose, { Schema, Document } from 'mongoose';
import { IRefreshToken } from '@realestate/shared-types';

export interface IRefreshTokenDocument extends Omit<IRefreshToken, '_id'>, Document {}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — auto-delete expired tokens
    },
  },
  {
    timestamps: true,
  }
);

export const RefreshToken = mongoose.model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);
