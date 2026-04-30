import mongoose, { Schema, Document } from 'mongoose';
import { IProject, ProjectStatus } from '@realestate/shared-types';

export interface IProjectDocument extends Omit<IProject, '_id'>, Document {}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    totalUnits: { type: Number, required: true },
    reraNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: Object.values(ProjectStatus), default: ProjectStatus.PLANNING },
    startDate: { type: Date, required: true },
    expectedCompletion: { type: Date, required: true },
    description: String,
    amenities: [String],
  },
  { timestamps: true }
);

ProjectSchema.index({ status: 1 });
ProjectSchema.index({ 'location.city': 1 });

export const Project = mongoose.model<IProjectDocument>('Project', ProjectSchema);
