import { Request, Response } from 'express';
import { PaymentProofService } from '../services/paymentProof.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../utils/AppError';

const paymentProofService = new PaymentProofService();

export const submitPaymentProof = catchAsync(
  async (req: Request, res: Response) => {
    const { tournamentId } = req.params;
    const { registrationId } = req.body;

    if (!req.file) {
      throw new AppError(
        'Payment proof file is required',
        400
      );
    }

    // Store a relative path in the database
    const proofUrl = `/uploads/payment-proofs/${req.file.filename}`;

    const paymentProof =
      await paymentProofService.submitPaymentProof(
        req.user!.id,
        tournamentId,
        proofUrl,
        registrationId || undefined
      );

    sendResponse(
      res,
      201,
      'Payment proof submitted successfully',
      paymentProof
    );
  }
);
export const getPendingPaymentProofs = catchAsync(
  async (_req: Request, res: Response) => {
    const paymentProofs =
      await paymentProofService.getPendingPaymentProofs();

    sendResponse(
      res,
      200,
      'Pending payment proofs retrieved successfully',
      paymentProofs
    );
  }
);
export const processPaymentProof = catchAsync(
  async (req: Request, res: Response) => {
    const { proofId } = req.params;
    const { action, rejectionReason, verificationId } = req.body;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      throw new AppError(
        'Action must be APPROVE or REJECT',
        400
      );
    }

    const paymentProof =
      await paymentProofService.processPaymentProof(
        req.user!.id,
        proofId,
        action,
        rejectionReason,
        verificationId
      );

    sendResponse(
      res,
      200,
      `Payment proof ${action.toLowerCase()}d successfully`,
      paymentProof
    );
  }
);
export const getMyPaymentProof = catchAsync(
  async (req: Request, res: Response) => {
    const { tournamentId } = req.params;

    const paymentProof =
      await paymentProofService.getMyPaymentProof(
        req.user!.id,
        tournamentId
      );

    sendResponse(
      res,
      200,
      'Payment proof status retrieved successfully',
      paymentProof
    );
  }
);
export const deleteMyPaymentProof = catchAsync(
  async (req: Request, res: Response) => {
    const { proofId } = req.params;

    await paymentProofService.deleteMyPaymentProof(
      req.user!.id,
      proofId
    );

    sendResponse(
      res,
      200,
      'Payment proof deleted successfully',
      null
    );
  }
);