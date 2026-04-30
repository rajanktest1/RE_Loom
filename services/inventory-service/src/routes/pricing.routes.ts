import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { PricingRule } from '../models/pricing-rule.model';
import { pricingEngine } from '../services/pricing.engine';
import { Unit } from '../models/unit.model';

const router = Router();

// GET /inventory/pricing/rules?projectId=
router.get(
  '/rules',
  asyncHandler(async (req, res) => {
    const { projectId, active } = req.query;
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = projectId;
    if (active !== undefined) filter.isActive = active === 'true';

    const rules = await PricingRule.find(filter).sort({ priority: -1 });
    res.json({ success: true, data: rules });
  })
);

// POST /inventory/pricing/rules — Create a pricing rule
router.post(
  '/rules',
  asyncHandler(async (req, res) => {
    const rule = await PricingRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  })
);

// PUT /inventory/pricing/rules/:id — Update a pricing rule
router.put(
  '/rules/:id',
  asyncHandler(async (req, res) => {
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }
    res.json({ success: true, data: rule });
  })
);

// DELETE /inventory/pricing/rules/:id
router.delete(
  '/rules/:id',
  asyncHandler(async (req, res) => {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }
    res.json({ success: true, message: 'Rule deleted' });
  })
);

// GET /inventory/pricing/calculate/:unitId — Calculate price breakdown for a unit
router.get(
  '/calculate/:unitId',
  asyncHandler(async (req, res) => {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    const { newPrice, breakdown } = await pricingEngine.recalculateUnitPrice(unit);
    res.json({ success: true, data: { unitId: unit._id, currentPrice: unit.currentPrice, calculatedPrice: newPrice, breakdown } });
  })
);

// POST /inventory/pricing/recalculate — Recalculate all unit prices for a project
router.post(
  '/recalculate',
  asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const units = await Unit.find({ projectId });
    const result = await pricingEngine.recalculateProjectPrices(projectId, units);
    res.json({
      success: true,
      data: { totalUnits: units.length, updated: result.updated },
      message: `Recalculated prices for ${units.length} units, ${result.updated} prices updated`,
    });
  })
);

export const pricingRoutes = router;
