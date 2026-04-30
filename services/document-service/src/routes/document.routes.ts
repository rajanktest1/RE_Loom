import { Router } from 'express';
import multer from 'multer';
import { Client as MinioClient } from 'minio';
import { asyncHandler } from '@realestate/shared-utils';
import { DocumentModel } from '../models/document.model';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// MinIO client
const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET = process.env.MINIO_BUCKET || 'realestate-documents';

// Ensure bucket exists on startup
(async () => {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
  }
})();

// Upload a document
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const { entityType, entityId, uploadedBy, description } = req.body;
    if (!entityType || !entityId || !uploadedBy) {
      return res.status(400).json({ success: false, message: 'entityType, entityId, and uploadedBy are required' });
    }

    const key = `${entityType}/${entityId}/${Date.now()}-${req.file.originalname}`;

    await minioClient.putObject(BUCKET, key, req.file.buffer, req.file.size, {
      'Content-Type': req.file.mimetype,
    });

    const doc = await DocumentModel.create({
      filename: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      bucket: BUCKET,
      key,
      entityType,
      entityId,
      uploadedBy,
      description,
    });

    res.status(201).json({ success: true, data: doc });
  })
);

// Get documents for an entity
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.query;
    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, message: 'entityType and entityId are required' });
    }

    const docs = await DocumentModel.find({ entityType, entityId }).sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  })
);

// Get pre-signed download URL
router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const url = await minioClient.presignedGetObject(doc.bucket, doc.key, 3600); // 1 hour expiry
    res.json({ success: true, data: { url, filename: doc.originalName } });
  })
);

// Delete a document
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await minioClient.removeObject(doc.bucket, doc.key);
    await DocumentModel.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Document deleted' });
  })
);

export const documentRoutes = router;
