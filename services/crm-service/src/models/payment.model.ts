import mongoose, { Schema, Document } from 'mongoose';
import { IPayment, PaymentStatus, PaymentMethod } from '@realestate/shared-types';

export interface IPaymentDocument extends Omit<IPayment, '_id'>, Document {}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    bookingId: { type: String, required: true, index: true },
    installmentNumber: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paidDate: Date,
    method: { type: String, enum: Object.values(PaymentMethod) },
    transactionId: String,
    receiptUrl: String,
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
  },
  { timestamps: true }
);

PaymentSchema.index({ bookingId: 1, installmentNumber: 1 });
PaymentSchema.index({ status: 1, dueDate: 1 });

export const Payment = mongoose.model<IPaymentDocument>('Payment', PaymentSchema);
