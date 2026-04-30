import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { Block } from '../models/block.model';

const router = Router();

// GET /inventory/blocks?projectId=xxx
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = projectId;

    const blocks = await Block.find(filter).sort({ name: 1 });
    res.json({ success: true, data: blocks });
  })
);

// POST /inventory/blocks
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const block = await Block.create(req.body);
    res.status(201).json({ success: true, data: block });
  })
);

// PUT /inventory/blocks/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const block = await Block.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }
    res.json({ success: true, data: block });
  })
);

export const blockRoutes = router;
