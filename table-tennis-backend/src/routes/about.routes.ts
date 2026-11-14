import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { uploadAboutImage } from '../middleware/aboutUpload.middleware';
import {
  getAboutContent,
  updateAboutContent,
  uploadAboutPoster,
} from '../controllers/about.controller';

const router = Router();

// Public: Get about page content
router.get('/', getAboutContent);

// Protected (Admin only): Update about page content
router.put('/', authenticate, isAdmin, updateAboutContent);

// Protected (Admin only): Upload about page image/poster
router.post('/upload', authenticate, isAdmin, uploadAboutImage.single('image'), uploadAboutPoster);

export default router;

