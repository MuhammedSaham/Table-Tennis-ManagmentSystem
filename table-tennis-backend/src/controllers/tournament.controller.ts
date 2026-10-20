import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

// Create tournament (Admin only)
export const createTournament = catchAsync(async (req: Request, res: Response) => {
  const { name, description, venue, startDate, endDate, registrationDeadline, maxPlayers,tournamentType,registrationFee,requirePaymentProofClub,requirePaymentProofGuest,paymentInstructions, } = req.body;

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    throw new AppError('End date must be after start date', 400);
  }

  if (new Date(registrationDeadline) >= new Date(startDate)) {
    throw new AppError('Registration deadline must be before tournament start', 400);
  }

  const tournament = await prisma.tournament.create({
    data: {
      name,
      description,
      venue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      maxPlayers,
      tournamentType: tournamentType === 'GROUP_KNOCKOUT' ? 'GROUP_KNOCKOUT' : 'KNOCKOUT', // ← ADD THIS LINE
      registrationFee: registrationFee !== undefined ? registrationFee : null,
      requirePaymentProofClub: requirePaymentProofClub ?? false,
      requirePaymentProofGuest: requirePaymentProofGuest ?? false,
      paymentInstructions: paymentInstructions || null,
    },
  });

  sendResponse(res, 201, 'Tournament created successfully', tournament);
});

// Get all tournaments
export const getAllTournaments = catchAsync(async (req: Request, res: Response) => {
  const tournaments = await prisma.tournament.findMany({
    include: {
      categories: {
        select: {
          id: true,
          name: true,
          type: true,
          stageFormat: true,
          maxParticipants: true,
          currentParticipants: true,
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  sendResponse(res, 200, 'Tournaments retrieved successfully', tournaments);
});

// Get tournament by ID
export const getTournamentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      },
      registrations: {
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: true,
          team: {
            include: {
              members: {
                include: {
                  player: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      matches: {
        take: 10,
        orderBy: { scheduledTime: 'asc' },
        include: {
          player1: { select: { firstName: true, lastName: true } },
          player2: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  sendResponse(res, 200, 'Tournament retrieved successfully', tournament);
});

// Update tournament (Admin only)
export const updateTournament = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  const { name, description, venue, startDate, endDate, registrationDeadline, status, maxPlayers,registrationFee,requirePaymentProofClub,requirePaymentProofGuest,paymentInstructions } = req.body;

  const updatedTournament = await prisma.tournament.update({
    where: { id },
    data: {
      name: name || undefined,
      description: description !== undefined ? description : undefined,
      venue: venue || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      status: status || undefined,
      maxPlayers: maxPlayers !== undefined ? maxPlayers : undefined,
      registrationFee: registrationFee !== undefined ? registrationFee : undefined,
      requirePaymentProofClub: requirePaymentProofClub !== undefined ? requirePaymentProofClub : undefined,
      requirePaymentProofGuest: requirePaymentProofGuest !== undefined ? requirePaymentProofGuest : undefined,
      paymentInstructions: paymentInstructions !== undefined ? paymentInstructions : undefined,
    },
  });

  sendResponse(res, 200, 'Tournament updated successfully', updatedTournament);
});

// Delete tournament (Admin only)
export const deleteTournament = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  // Delete tournament (cascade will handle related records if configured)
  await prisma.tournament.delete({
    where: { id },
  });

  sendResponse(res, 200, 'Tournament deleted successfully');
});

// Add category to tournament (Admin only)
export const addCategory = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  const { name, type, minAge, maxAge, gender, maxParticipants, stageFormat } = req.body;

  const existingCategory = await prisma.category.findFirst({
  where: {
    tournamentId,
    name: {
      equals: name,
      mode: 'insensitive',
    },
  },
});

if (existingCategory) {
  throw new AppError(
    `A category named "${name}" already exists in this tournament`,
    400
  );
}

  const category = await prisma.category.create({
    data: {
      tournamentId,
      name,
      type,
      stageFormat: stageFormat === 'GROUP_KNOCKOUT' ? 'GROUP_KNOCKOUT' : 'KNOCKOUT',
      minAge,
      maxAge,
      gender,
      maxParticipants,
    },
  });

  sendResponse(res, 201, 'Category added successfully', category);
});

// Get tournament categories
export const getTournamentCategories = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;

  const categories = await prisma.category.findMany({
    where: { tournamentId },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  sendResponse(res, 200, 'Categories retrieved successfully', categories);
});

// Update category (Admin only)
export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const { name, type, minAge, maxAge, gender, maxParticipants, stageFormat } = req.body;

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: name || undefined,
      type: type || undefined,
      stageFormat: stageFormat || undefined,
      minAge: minAge !== undefined ? (minAge !== null && minAge !== '' ? Number(minAge) : null) : undefined,
      maxAge: maxAge !== undefined ? (maxAge !== null && maxAge !== '' ? Number(maxAge) : null) : undefined,
      gender: gender !== undefined ? (gender ? gender : null) : undefined,
      maxParticipants: maxParticipants !== undefined ? Number(maxParticipants) : undefined,
    },
  });

  sendResponse(res, 200, 'Category updated successfully', updatedCategory);
});

// Delete category (Admin only)
export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  sendResponse(res, 200, 'Category deleted successfully');
});