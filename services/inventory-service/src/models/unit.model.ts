import mongoose, { Schema, Document } from 'mongoose';
import { IUnit, UnitStatus, UnitType, UnitFacing } from '@realestate/shared-types';

export interface IUnitDocument extends Omit<IUnit, '_id'>, Document {}

const UnitSchema = new Schema<IUnitDocument>(
  {
    projectId: { type: String, required: true, index: true },
    blockId: { type: String, required: true, index: true },
    floor: { type: Number, required: true },
    unitNumber: { type: String, required: true },
    type: { type: String, enum: Object.values(UnitType), required: true },
    carpetArea: { type: Number, required: true },
    superBuiltupArea: { type: Number, required: true },
    facing: { type: String, enum: Object.values(UnitFacing), required: true },
    status: { type: String, enum: Object.values(UnitStatus), default: UnitStatus.AVAILABLE },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    lockedBy: String,
    lockExpiresAt: Date,
    soldTo: String,
    bookingId: String,
    documents: [String],
  },
  { timestamps: true }
);

UnitSchema.index({ projectId: 1, blockId: 1, floor: 1 });
UnitSchema.index({ status: 1 });
UnitSchema.index({ lockExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const Unit = mongoose.model<IUnitDocument>('Unit', UnitSchema);
