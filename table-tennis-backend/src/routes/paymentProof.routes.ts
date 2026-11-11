import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isPlayer, hasPermission } from '../middleware/role.middleware';
import { uploadPaymentProof } from '../middleware/paymentProofUpload.middleware';
import { submitPaymentProof,getPendingPaymentProofs,processPaymentProof,getMyPaymentProof,deleteMyPaymentProof } from '../controllers/paymentProof.controller';

const router = Router();

router.use(authenticate);

// Admin gets all pending payment proofs
router.get(
  '/pending',
  hasPermission('MANAGE_REGISTRATIONS'),
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
  hasPermission('MANAGE_REGISTRATIONS'),
  processPaymentProof
);

// Player deletes their own payment proof
router.delete(
  '/:proofId',
  isPlayer,
  deleteMyPaymentProof
);

// Player uploads one payment proof for a tournament
router.post(
  '/:tournamentId',
  isPlayer,
  uploadPaymentProof.single('proof'),
  submitPaymentProof
);

export default router;