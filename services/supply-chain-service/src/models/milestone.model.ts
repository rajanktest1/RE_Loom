import mongoose, { Schema, Document } from 'mongoose';
import { IMilestone, MilestoneStatus } from '@realestate/shared-types';

export interface IMilestoneDocument extends Omit<IMilestone, '_id'>, Document {}

const MilestoneSchema = new Schema<IMilestoneDocument>(
  {
    projectId: { type: String, required: true, index: true },
    blockId: String,
    name: { type: String, required: true },
    description: { type: String, required: true },
    targetDate: { type: Date, required: true },
    completedDate: Date,
    status: { type: String, enum: Object.values(MilestoneStatus), default: MilestoneStatus.PENDING },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    dependencies: [String],
    assignedTo: String,
  },
  { timestamps: true }
);

MilestoneSchema.index({ projectId: 1, status: 1 });

export const Milestone = mongoose.model<IMilestoneDocument>('Milestone', MilestoneSchema);
