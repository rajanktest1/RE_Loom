import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { UnitStatus } from '@realestate/shared-types';
import { Unit } from '../models/unit.model';

const router = Router();

// GET /inventory/units?projectId=&blockId=&status=&floor=&type=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { projectId, blockId, status, floor, type, page = 1, limit = 50 } = req.query;
    const filter: Record<string, unknown> = {};

    if (projectId) filter.projectId = projectId;
    if (blockId) filter.blockId = blockId;
    if (status) filter.status = status;
    if (floor) filter.floor = Number(floor);
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [units, total] = await Promise.all([
      Unit.find(filter).skip(skip).limit(Number(limit)).sort({ floor: 1, unitNumber: 1 }),
      Unit.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: units,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  })
);

// GET /inventory/units/stacking-plan?projectId=&blockId=
router.get(
  '/stacking-plan',
  asyncHandler(async (req, res) => {
    const { projectId, blockId } = req.query;
    if (!projectId || !blockId) {
      return res.status(400).json({ success: false, message: 'projectId and blockId are required' });
    }

    const units = await Unit.find({ projectId, blockId })
      .select('floor unitNumber type status currentPrice facing lockedBy lockExpiresAt')
      .sort({ floor: -1, unitNumber: 1 });

    // Group by floor for stacking plan view
    const stackingPlan: Record<number, typeof units> = {};
    units.forEach((unit) => {
      if (!stackingPlan[unit.floor]) stackingPlan[unit.floor] = [];
      stackingPlan[unit.floor].push(unit);
    });

    res.json({ success: true, data: stackingPlan });
  })
);

// GET /inventory/units/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.json({ success: true, data: unit });
  })
);

// POST /inventory/units
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const unit = await Unit.create(req.body);
    res.status(201).json({ success: true, data: unit });
  })
);

// PUT /inventory/units/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.json({ success: true, data: unit });
  })
);

// POST /inventory/units/:id/lock — Soft-lock a unit (Redis-backed)
router.post(
  '/:id/lock',
  asyncHandler(async (req, res) => {
    const { userId, durationMinutes = 20 } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    if (unit.status === UnitStatus.SOLD || unit.status === UnitStatus.BLOCKED) {
      return res.status(409).json({ success: false, message: `Unit is ${unit.status} and cannot be locked` });
    }

    const lockService = req.app.get('unitLockService');
    const result = await lockService.acquireLock(req.params.id, userId, durationMinutes * 60);

    if (!result.success) {
      return res.status(409).json({ success: false, ...result });
    }

    res.json({ success: true, data: { unitId: req.params.id, ...result } });
  })
);

// POST /inventory/units/:id/unlock — Release a soft-lock (Redis-backed)
router.post(
  '/:id/unlock',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const lockService = req.app.get('unitLockService');
    const result = await lockService.releaseLock(req.params.id, userId);

    if (!result.success) {
      return res.status(409).json({ success: false, ...result });
    }

    res.json({ success: true, data: { unitId: req.params.id, ...result } });
  })
);

// GET /inventory/units/:id/lock-status — Check lock status
router.get(
  '/:id/lock-status',
  asyncHandler(async (req, res) => {
    const lockService = req.app.get('unitLockService');
    const status = await lockService.getLockStatus(req.params.id);
    res.json({ success: true, data: { unitId: req.params.id, ...status } });
  })
);

export const unitRoutes = router;
