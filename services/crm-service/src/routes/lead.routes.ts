import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { EventName } from '@realestate/shared-types';
import { Lead } from '../models/lead.model';
import { rabbitmq } from '../index';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { stage, source, assignedTo, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (stage) filter.stage = stage;
  if (source) filter.source = source;
  if (assignedTo) filter.assignedTo = assignedTo;

  const skip = (Number(page) - 1) * Number(limit);
  const [leads, total] = await Promise.all([
    Lead.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Lead.countDocuments(filter),
  ]);

  res.json({ success: true, data: leads, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
}));

// Pipeline view (counts per stage)
router.get('/pipeline', asyncHandler(async (_req, res) => {
  const pipeline = await Lead.aggregate([
    { $group: { _id: '$stage', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: pipeline });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: lead });
}));

router.post('/', asyncHandler(async (req, res) => {
  const lead = await Lead.create(req.body);

  await rabbitmq.publish(EventName.LEAD_CREATED, {
    eventName: EventName.LEAD_CREATED,
    timestamp: new Date(),
    correlationId: lead._id.toString(),
    source: 'crm-service',
    payload: { leadId: lead._id.toString(), name: lead.name, email: lead.email, source: lead.source },
  });

  res.status(201).json({ success: true, data: lead });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const oldLead = await Lead.findById(req.params.id);
  if (!oldLead) return res.status(404).json({ success: false, message: 'Lead not found' });

  const previousStage = oldLead.stage;
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });

  // Publish stage change event
  if (lead && req.body.stage && req.body.stage !== previousStage) {
    await rabbitmq.publish(EventName.LEAD_STAGE_CHANGED, {
      eventName: EventName.LEAD_STAGE_CHANGED,
      timestamp: new Date(),
      correlationId: lead._id.toString(),
      source: 'crm-service',
      payload: {
        leadId: lead._id.toString(),
        previousStage,
        newStage: lead.stage,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
      },
    });
  }

  res.json({ success: true, data: lead });
}));

export const leadRoutes = router;
