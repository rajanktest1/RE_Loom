import mongoose, { Schema, Document } from 'mongoose';
import { IVendor, VendorCategory } from '@realestate/shared-types';

export interface IVendorDocument extends Omit<IVendor, '_id'>, Document {}

const VendorSchema = new Schema<IVendorDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: Object.values(VendorCategory), required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    gstin: String,
    address: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    contracts: [
      {
        contractNumber: String,
        startDate: Date,
        endDate: Date,
        value: Number,
        description: String,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

VendorSchema.index({ category: 1, isActive: 1 });

export const Vendor = mongoose.model<IVendorDocument>('Vendor', VendorSchema);
