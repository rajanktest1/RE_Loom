import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  key: string;
  entityType: 'unit' | 'project' | 'booking' | 'vendor' | 'qc';
  entityId: string;
  uploadedBy: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentModel extends Omit<IDocument, '_id'>, Document {}

const DocumentSchema = new Schema<IDocumentModel>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    bucket: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    entityType: { type: String, enum: ['unit', 'project', 'booking', 'vendor', 'qc'], required: true },
    entityId: { type: String, required: true, index: true },
    uploadedBy: { type: String, required: true },
    description: String,
  },
  { timestamps: true }
);

DocumentSchema.index({ entityType: 1, entityId: 1 });

export const DocumentModel = mongoose.model<IDocumentModel>('Document', DocumentSchema);
