import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { EventName } from '@realestate/shared-types';
import { Milestone } from '../models/milestone.model';
import { rabbitmq } from '../index';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { projectId, blockId, status } = req.query;
  const filter: Record<string, unknown> = {};
  if (projectId) filter.projectId = projectId;
  if (blockId) filter.blockId = blockId;
  if (status) filter.status = status;

  const milestones = await Milestone.find(filter).sort({ targetDate: 1 });
  res.json({ success: true, data: milestones });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
  res.json({ success: true, data: milestone });
}));

router.post('/', asyncHandler(async (req, res) => {
  const milestone = await Milestone.create(req.body);
  res.status(201).json({ success: true, data: milestone });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

  // If milestone is marked completed, publish event
  if (milestone.status === 'completed' && req.body.status === 'completed') {
    await rabbitmq.publish(EventName.MILESTONE_COMPLETED, {
      eventName: EventName.MILESTONE_COMPLETED,
      timestamp: new Date(),
      correlationId: milestone._id.toString(),
      source: 'supply-chain-service',
      payload: {
        milestoneId: milestone._id.toString(),
        projectId: milestone.projectId,
        blockId: milestone.blockId,
        milestoneName: milestone.name,
      },
    });
  }

  res.json({ success: true, data: milestone });
}));

export const milestoneRoutes = router;
