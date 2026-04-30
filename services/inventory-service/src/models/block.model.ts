import mongoose, { Schema, Document } from 'mongoose';
import { IBlock } from '@realestate/shared-types';

export interface IBlockDocument extends Omit<IBlock, '_id'>, Document {}

const BlockSchema = new Schema<IBlockDocument>(
  {
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    totalFloors: { type: Number, required: true },
    unitsPerFloor: { type: Number, required: true },
    totalUnits: { type: Number, required: true },
  },
  { timestamps: true }
);

BlockSchema.index({ projectId: 1, name: 1 }, { unique: true });

export const Block = mongoose.model<IBlockDocument>('Block', BlockSchema);
