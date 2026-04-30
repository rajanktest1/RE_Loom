import mongoose, { Schema, Document } from 'mongoose';
import { IBooking, BookingStatus, PaymentPlanType } from '@realestate/shared-types';

export interface IBookingDocument extends Omit<IBooking, '_id'>, Document {}

const BookingSchema = new Schema<IBookingDocument>(
  {
    leadId: { type: String, required: true, index: true },
    unitId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    agreementNumber: { type: String, required: true, unique: true },
    bookingDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    discount: Number,
    paymentPlan: { type: String, enum: Object.values(PaymentPlanType), required: true },
    installments: [
      {
        installmentNumber: { type: Number, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        percentage: { type: Number, required: true },
      },
    ],
    status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.BOOKED },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBookingDocument>('Booking', BookingSchema);
