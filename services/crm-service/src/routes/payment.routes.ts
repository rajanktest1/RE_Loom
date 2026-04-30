import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { EventName } from '@realestate/shared-types';
import { Payment } from '../models/payment.model';
import { rabbitmq } from '../index';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { bookingId, status, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (bookingId) filter.bookingId = bookingId;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter).skip(skip).limit(Number(limit)).sort({ dueDate: 1 }),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, data: payments, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const payment = await Payment.create(req.body);
  res.status(201).json({ success: true, data: payment });
}));

// Record a payment
router.put('/:id/pay', asyncHandler(async (req, res) => {
  const { method, transactionId, paidDate } = req.body;
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    {
      status: 'paid',
      method,
      transactionId,
      paidDate: paidDate || new Date(),
    },
    { new: true }
  );

  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

  // Publish payment received event
  await rabbitmq.publish(EventName.PAYMENT_RECEIVED, {
    eventName: EventName.PAYMENT_RECEIVED,
    timestamp: new Date(),
    correlationId: payment._id.toString(),
    source: 'crm-service',
    payload: {
      paymentId: payment._id.toString(),
      bookingId: payment.bookingId,
      amount: payment.amount,
      installmentNumber: payment.installmentNumber,
    },
  });

  res.json({ success: true, data: payment, message: 'Payment recorded successfully' });
}));

export const paymentRoutes = router;
