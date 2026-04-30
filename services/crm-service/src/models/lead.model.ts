import mongoose, { Schema, Document } from 'mongoose';
import { ILead, LeadSource, LeadStage } from '@realestate/shared-types';

export interface ILeadDocument extends Omit<ILead, '_id'>, Document {}

const LeadSchema = new Schema<ILeadDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    source: { type: String, enum: Object.values(LeadSource), required: true },
    assignedTo: String,
    stage: { type: String, enum: Object.values(LeadStage), default: LeadStage.NEW },
    notes: [
      {
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        createdBy: String,
      },
    ],
    projectInterest: [String],
    unitInterest: [String],
    budget: {
      min: Number,
      max: Number,
    },
  },
  { timestamps: true }
);

LeadSchema.index({ stage: 1, assignedTo: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ email: 1 });

export const Lead = mongoose.model<ILeadDocument>('Lead', LeadSchema);
