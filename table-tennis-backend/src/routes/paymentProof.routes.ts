import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isPlayer,isAdmin } from '../middleware/role.middleware';
import { uploadPaymentProof } from '../middleware/paymentProofUpload.middleware';
import { submitPaymentProof,getPendingPaymentProofs,processPaymentProof,getMyPaymentProof } from '../controllers/paymentProof.controller';

const router = Router();

router.use(authenticate);

// Admin gets all pending payment proofs
router.get(
  '/pending',
  isAdmin,
  getPendingPaymentProofs
);

// Player checks their own payment proof status
router.get(
  '/my/:tournamentId',
  isPlayer,
  getMyPaymentProof
);
// Admin approves or rejects a payment proof
router.patch(
  '/:proofId/process',
  isAdmin,
  processPaymentProof
);

// Player uploads one payment proof for a tournament
router.post(
  '/:tournamentId',
  isPlayer,
  uploadPaymentProof.single('proof'),
  submitPaymentProof
);

export default router;