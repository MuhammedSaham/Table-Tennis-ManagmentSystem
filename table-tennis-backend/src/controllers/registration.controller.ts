import { Request, Response } from 'express';
import { TournamentService } from '../services/tournament.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const tournamentService = new TournamentService();

// Register for tournament (Player only)
export const registerForTournament = catchAsync(async (req: Request, res: Response) => {
  const registration = await tournamentService.registerForTournament(req.user!.id, req.body);
  sendResponse(res, 201, 'Registration submitted successfully', registration);
});

// Get my registrations (Player only)
export const getMyRegistrations = catchAsync(async (req: Request, res: Response) => {
  const registrations = await tournamentService.getMyRegistrations(req.user!.id);
  sendResponse(res, 200, 'Registrations retrieved successfully', registrations);
});

// Get tournament registrations (Admin/Referee)
export const getTournamentRegistrations = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const { status, categoryId } = req.query;
  const registrations = await tournamentService.getTournamentRegistrations(tournamentId, status as string, categoryId as string,);
  sendResponse(res, 200, 'Registrations retrieved successfully', registrations);
});

// Process registration (Admin only)
export const processRegistration = catchAsync(async (req: Request, res: Response) => {
  const { registrationId } = req.params;
  const { action, rejectionReason } = req.body;
  
  const registration = await tournamentService.processRegistration(
    req.user!.id,
    registrationId,
    action,
    rejectionReason
  );
  
  sendResponse(res, 200, `Registration ${action.toLowerCase()}d successfully`, registration);
});

// Cancel registration (Player only)
export const cancelRegistration = catchAsync(async (req: Request, res: Response) => {
  const { registrationId } = req.params;
  const registration = await tournamentService.cancelRegistration(req.user!.id, registrationId);
  sendResponse(res, 200, 'Registration cancelled successfully', registration);
});

export const removeRegistrationByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { registrationId } = req.params;

    const registration =
      await tournamentService.removeRegistrationByAdmin(
        req.user!.id,
        registrationId
      );

    sendResponse(
      res,
      200,
      'Registration removed successfully',
      registration
    );
  }
);
