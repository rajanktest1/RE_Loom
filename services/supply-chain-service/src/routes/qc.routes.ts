import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { EventName } from '@realestate/shared-types';
import { QCChecklist } from '../models/qc-checklist.model';
import { rabbitmq } from '../index';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { milestoneId, blockId, overallStatus } = req.query;
  const filter: Record<string, unknown> = {};
  if (milestoneId) filter.milestoneId = milestoneId;
  if (blockId) filter.blockId = blockId;
  if (overallStatus) filter.overallStatus = overallStatus;

  const checklists = await QCChecklist.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: checklists });
}));

router.post('/', asyncHandler(async (req, res) => {
  const checklist = await QCChecklist.create(req.body);
  res.status(201).json({ success: true, data: checklist });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const checklist = await QCChecklist.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!checklist) return res.status(404).json({ success: false, message: 'QC Checklist not found' });

  // If QC passed, publish event
  if (checklist.overallStatus === 'passed') {
    await rabbitmq.publish(EventName.QC_PASSED, {
      eventName: EventName.QC_PASSED,
      timestamp: new Date(),
      correlationId: checklist._id.toString(),
      source: 'supply-chain-service',
      payload: {
        checklistId: checklist._id.toString(),
        milestoneId: checklist.milestoneId,
        unitId: checklist.unitId,
        blockId: checklist.blockId,
      },
    });
  }

  res.json({ success: true, data: checklist });
}));

export const qcRoutes = router;
