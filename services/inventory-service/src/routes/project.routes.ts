import { Router } from 'express';
import { asyncHandler } from '@realestate/shared-utils';
import { Project } from '../models/project.model';

const router = Router();

// GET /inventory/projects
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: projects,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  })
);

// GET /inventory/projects/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  })
);

// POST /inventory/projects
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  })
);

// PUT /inventory/projects/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  })
);

export const projectRoutes = router;
