import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { EventName } from '@realestate/shared-types';
import { Booking } from '../models/booking.model';
import { rabbitmq } from '../index';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { buyerId, unitId, status, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (buyerId) filter.buyerId = buyerId;
  if (unitId) filter.unitId = unitId;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [bookings, total] = await Promise.all([
    Booking.find(filter).skip(skip).limit(Number(limit)).sort({ bookingDate: -1 }),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data: bookings, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, data: booking });
}));

router.post('/', asyncHandler(async (req, res) => {
  const booking = await Booking.create(req.body);

  // Publish booking created event
  await rabbitmq.publish(EventName.BOOKING_CREATED, {
    eventName: EventName.BOOKING_CREATED,
    timestamp: new Date(),
    correlationId: booking._id.toString(),
    source: 'crm-service',
    payload: {
      bookingId: booking._id.toString(),
      unitId: booking.unitId,
      buyerId: booking.buyerId,
      leadId: booking.leadId,
      totalPrice: booking.totalPrice,
    },
  });

  res.status(201).json({ success: true, data: booking });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, data: booking });
}));

export const bookingRoutes = router;
