import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { PurchaseOrder } from '../models/purchase-order.model';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { projectId, vendorId, status, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (projectId) filter.projectId = projectId;
  if (vendorId) filter.vendorId = vendorId;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    PurchaseOrder.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    PurchaseOrder.countDocuments(filter),
  ]);

  res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
  res.json({ success: true, data: po });
}));

router.post('/', asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.create(req.body);
  res.status(201).json({ success: true, data: po });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
  res.json({ success: true, data: po });
}));

export const purchaseOrderRoutes = router;
