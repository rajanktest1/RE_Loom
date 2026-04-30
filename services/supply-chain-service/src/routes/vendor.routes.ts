import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { Vendor } from '../models/vendor.model';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { category, isActive } = req.query;
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const vendors = await Vendor.find(filter).sort({ name: 1 });
  res.json({ success: true, data: vendors });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
  res.json({ success: true, data: vendor });
}));

router.post('/', asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  res.status(201).json({ success: true, data: vendor });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
  res.json({ success: true, data: vendor });
}));

export const vendorRoutes = router;
