import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/review-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for review images
const reviewImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const reviewImageUpload = multer({
  storage: reviewImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload review image
router.post('/review-image', requireAuth, reviewImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: req.locale === 'ar' ? 'لم يتم رفع أي صورة' : 'No image uploaded'
      });
    }

    const imageUrl = `/uploads/review-images/${req.file.filename}`;

    // Audit the upload
    await audit({
      action: 'review_image_uploaded',
      entity: 'upload',
      entityId: req.file.filename,
      userId: req.user.id,
      meta: { filename: req.file.filename, size: req.file.size }
    });

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      message: req.locale === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading review image:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في رفع الصورة' : 'Error uploading image'
    });
  }
});

// Delete review image
router.delete('/review-image/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: req.locale === 'ar' ? 'الصورة غير موجودة' : 'Image not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    // Audit the deletion
    await audit({
      action: 'review_image_deleted',
      entity: 'upload',
      entityId: filename,
      userId: req.user.id,
      meta: { filename }
    });

    res.json({
      success: true,
      message: req.locale === 'ar' ? 'تم حذف الصورة بنجاح' : 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review image:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في حذف الصورة' : 'Error deleting image'
    });
  }
});

// Get review images for a review (if needed for admin)
router.get('/review-images/:reviewId', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    // This would need to be implemented based on your review image storage
    // For now, return empty array
    res.json({
      success: true,
      images: []
    });
  } catch (error) {
    console.error('Error fetching review images:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في جلب الصور' : 'Error fetching images'
    });
  }
});

export default router;