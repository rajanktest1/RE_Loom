import mongoose, { Schema, Document } from 'mongoose';
import { IPurchaseOrder, PurchaseOrderStatus } from '@realestate/shared-types';

export interface IPurchaseOrderDocument extends Omit<IPurchaseOrder, '_id'>, Document {}

const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>(
  {
    vendorId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    poNumber: { type: String, required: true, unique: true },
    items: [
      {
        name: { type: String, required: true },
        description: String,
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(PurchaseOrderStatus), default: PurchaseOrderStatus.DRAFT },
    approvedBy: String,
    approvedAt: Date,
    deliveryDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model<IPurchaseOrderDocument>('PurchaseOrder', PurchaseOrderSchema);
