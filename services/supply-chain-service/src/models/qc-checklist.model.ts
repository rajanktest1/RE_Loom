import mongoose, { Schema, Document } from 'mongoose';
import { IQCChecklist, QCStatus } from '@realestate/shared-types';

export interface IQCChecklistDocument extends Omit<IQCChecklist, '_id'>, Document {}

const QCChecklistSchema = new Schema<IQCChecklistDocument>(
  {
    milestoneId: { type: String, required: true, index: true },
    unitId: String,
    blockId: String,
    inspectorId: { type: String, required: true },
    items: [
      {
        name: { type: String, required: true },
        description: String,
        status: { type: String, enum: Object.values(QCStatus), default: QCStatus.PENDING },
        remarks: String,
        photos: [String],
      },
    ],
    overallStatus: { type: String, enum: Object.values(QCStatus), default: QCStatus.PENDING },
    remarks: String,
    inspectedAt: Date,
  },
  { timestamps: true }
);

export const QCChecklist = mongoose.model<IQCChecklistDocument>('QCChecklist', QCChecklistSchema);
