import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import fs from 'fs';
import path from 'path';

export class PaymentProofService {
  
async submitPaymentProof(
  playerId: string,
  tournamentId: string,
  proofUrl: string,
  registrationId?: string
) {
  const player = await prisma.playerProfile.findUnique({
    where: { userId: playerId },
  });

  if (!player) {
    throw new AppError('Player profile not found', 404);
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  const paymentProofRequired = player.isClubMember
    ? tournament.requirePaymentProofClub
    : tournament.requirePaymentProofGuest;

  if (!paymentProofRequired) {
    throw new AppError(
      'Payment proof is not required for this player',
      400
    );
  }

  const registrations = await prisma.tournamentRegistration.findMany({
    where: {
      tournamentId,
      status: { in: ['PENDING', 'REJECTED'] },
      OR: [
        { playerId, teamId: null },
        {
          team: {
            members: {
              some: {
                playerId,
                isActive: true,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      status: true,
      categoryId: true,
    },
  });

  if (registrations.length === 0) {
    throw new AppError(
      'No eligible tournament registrations found',
      404
    );
  }

  const existingVerifications =
    await prisma.registrationPaymentVerification.findMany({
      where: {
        playerId,
        registrationId: {
          in: registrations.map((r) => r.id),
        },
      },
    });

  let selectedRegistrations = registrations;

  if (registrationId) {
    const selected = registrations.find(
      (registration) => registration.id === registrationId
    );

    if (!selected) {
      throw new AppError(
        'Registration not found or does not belong to you',
        404
      );
    }

    const verification = existingVerifications.find(
      (item) => item.registrationId === registrationId
    );

    if (!verification || verification.status !== 'REJECTED') {
      throw new AppError(
        'Only rejected category payments can be resubmitted',
        400
      );
    }

    selectedRegistrations = [selected];
  } else {
    const previousProof = await prisma.tournamentPaymentProof.findFirst({
      where: { tournamentId, playerId },
      select: { id: true },
    });

    if (previousProof || existingVerifications.length > 0) {
      throw new AppError(
        'An initial payment proof already exists. Resubmit only rejected categories.',
        400
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const proof = await tx.tournamentPaymentProof.create({
      data: {
        tournamentId,
        playerId,
        registrationId: registrationId ?? null,
        proofUrl,
        status: 'PENDING',
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            registrationFee: true,
          },
        },
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    for (const registration of selectedRegistrations) {
      await tx.registrationPaymentVerification.upsert({
        where: {
          registrationId_playerId: {
            registrationId: registration.id,
            playerId,
          },
        },
        create: {
          registrationId: registration.id,
          playerId,
          proofId: proof.id,
          status: 'PENDING',
        },
        update: {
          proofId: proof.id,
          status: 'PENDING',
          verifiedBy: null,
          verifiedAt: null,
          rejectionReason: null,
        },
      });

      await tx.paymentVerificationHistory.create({
        data: {
          registrationId: registration.id,
          playerId,
          proofId: proof.id,
          status: 'PENDING',
        },
      });

      if (registration.status === 'REJECTED') {
        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: 'PENDING',
            rejectionReason: null,
            approvedBy: null,
            approvedAt: null,
          },
        });
      }
    }

    return proof;
  });

  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN'] },
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      const playerName =
        `${result.player.firstName} ${result.player.lastName}`.trim();

      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'PAYMENT_VERIFICATION_REQUEST',
          title: 'Payment Verification Request',
          message:
            `${playerName} submitted payment proof for ${result.tournament.name}.`,
        })),
      });
    }
  } catch (error) {
    console.error(
      'Failed to notify admins about payment verification request:',
      error
    );
  }

  return result;
}

  
async getPendingPaymentProofs() {
  const paymentProofs = await prisma.tournamentPaymentProof.findMany({
    where: {
      verifications: {
        some: {
          status: 'PENDING',
        },
      },
    },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          registrationFee: true,
        },
      },
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          playerProfile: {
            select: {
              isClubMember: true,
              gender: true,
            },
          },
        },
      },
      verifications: {
        where: {
          status: 'PENDING',
        },
        include: {
          registration: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: 'asc',
    },
  });

  return paymentProofs.map((proof) => ({
    ...proof,
    registrations: proof.verifications.map((verification) => ({
      ...verification.registration,
      verificationId: verification.id,
      verificationStatus: verification.status,
      verificationPlayerId: verification.playerId,
    })),
  }));
}


async processPaymentProof(
  adminId: string,
  proofId: string,
  action: 'APPROVE' | 'REJECT',
  rejectionReason?: string,
  verificationId?: string
) {
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError(
      'Only admins can process payment proofs',
      403
    );
  }

  if (!verificationId) {
    throw new AppError(
      'A category verification ID is required',
      400
    );
  }

  if (action === 'REJECT' && !rejectionReason?.trim()) {
    throw new AppError(
      'Rejection reason is required',
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    const verification =
      await tx.registrationPaymentVerification.findUnique({
        where: { id: verificationId },
        include: {
          registration: {
            include: {
              category: true,
              team: {
                include: {
                  members: {
                    where: { isActive: true },
                    select: { playerId: true },
                  },
                },
              },
            },
          },
        },
      });

    if (!verification || verification.proofId !== proofId) {
      throw new AppError(
        'Payment verification not found for this receipt',
        404
      );
    }

    if (verification.status !== 'PENDING') {
      throw new AppError(
        'This category payment has already been processed',
        400
      );
    }

    const registration = verification.registration;

    if (
      registration.status === 'CANCELLED' ||
      registration.status === 'APPROVED'
    ) {
      throw new AppError(
        'This registration is not awaiting payment approval',
        400
      );
    }

    const now = new Date();
    const newStatus =
      action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Prevent duplicate processing of the same verification.
    const updated = await tx.registrationPaymentVerification.updateMany({
      where: {
        id: verification.id,
        proofId,
        status: 'PENDING',
      },
      data: {
        status: newStatus,
        verifiedBy: adminId,
        verifiedAt: now,
        rejectionReason:
          action === 'REJECT' ? rejectionReason!.trim() : null,
      },
    });

    if (updated.count !== 1) {
      throw new AppError(
        'This category payment has already been processed',
        409
      );
    }

    await tx.paymentVerificationHistory.create({
      data: {
        registrationId: registration.id,
        playerId: verification.playerId,
        proofId,
        status: newStatus,
        verifiedBy: adminId,
        rejectionReason:
          action === 'REJECT' ? rejectionReason!.trim() : null,
      },
    });

    if (action === 'APPROVE') {
      let allRequiredPlayersApproved = true;

      if (registration.teamId) {
        const memberIds =
          registration.team?.members.map((m) => m.playerId) ?? [];

        if (memberIds.length === 0) {
          throw new AppError(
            'No active members found for this team',
            400
          );
        }

        const approvedCount =
          await tx.registrationPaymentVerification.count({
            where: {
              registrationId: registration.id,
              playerId: { in: memberIds },
              status: 'APPROVED',
            },
          });

        allRequiredPlayersApproved =
          approvedCount === memberIds.length;
      }

      if (allRequiredPlayersApproved) {
        // Claim one remaining category slot atomically.
        if (registration.categoryId) {
          const capacity = await tx.category.updateMany({
            where: {
              id: registration.categoryId,
              currentParticipants: {
                lt: registration.category?.maxParticipants ?? 0,
              },
            },
            data: {
              currentParticipants: { increment: 1 },
            },
          });

          if (capacity.count !== 1) {
            throw new AppError(
              `Category "${registration.category?.name ?? 'Unknown'}" is full`,
              400
            );
          }
        }

        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: 'APPROVED',
            approvedBy: adminId,
            approvedAt: now,
            rejectionReason: null,
          },
        });
      }
    } else {
      // For teams, the registration remains pending while
      // the rejected partner resubmits their own payment.
      if (!registration.teamId) {
        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason!.trim(),
            approvedBy: null,
            approvedAt: null,
          },
        });
      }
    }

    return tx.registrationPaymentVerification.findUnique({
      where: { id: verification.id },
    });
  });
}


async deleteMyPaymentProof(
  playerId: string,
  proofId: string
) {
  // Find the payment proof and verify ownership
  const paymentProof =
    await prisma.tournamentPaymentProof.findFirst({
      where: {
        id: proofId,
        playerId,
      },
    });

  if (!paymentProof) {
    throw new AppError(
      'Payment proof not found or you do not have permission to access it',
      404
    );
  }

  // Preserve all submitted receipts and verification history.
  // Rejected payments must be resubmitted using a new receipt.
  throw new AppError(
    'Submitted payment proofs cannot be deleted. If a category payment is rejected, please upload a replacement receipt for that category.',
    403
  );
}


async getMyPaymentProof(
  playerId: string,
  tournamentId: string
) {
  // Step 1: Find the logged-in player's profile
  const player = await prisma.playerProfile.findUnique({
    where: { userId: playerId },
  });

  if (!player) {
    throw new AppError('Player profile not found', 404);
  }

  // Step 2: Find the tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      registrationFee: true,
      requirePaymentProofClub: true,
      requirePaymentProofGuest: true,
      paymentInstructions: true,
    },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  // Step 3: Check whether this player requires payment
  const paymentProofRequired = player.isClubMember
    ? tournament.requirePaymentProofClub
    : tournament.requirePaymentProofGuest;

  // Step 4: Get this player's most recent receipt
  // Preserve the original response for frontend compatibility.
  const paymentProof =
    await prisma.tournamentPaymentProof.findFirst({
      where: {
        tournamentId,
        playerId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      select: {
        id: true,
        proofUrl: true,
        status: true,
        submittedAt: true,
        verifiedAt: true,
        rejectionReason: true,
        registrationId: true,
        playerId: true,
      },
    });

  // Step 5: Get the player's category-specific verifications
  const verifications =
    await prisma.registrationPaymentVerification.findMany({
      where: {
        playerId,
        registration: {
          tournamentId,
          OR: [
            {
              playerId,
              teamId: null,
            },
            {
              team: {
                members: {
                  some: {
                    playerId,
                    isActive: true,
                  },
                },
              },
            },
          ],
        },
      },
      include: {
        registration: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        proof: {
          select: {
            id: true,
            proofUrl: true,
            submittedAt: true,
            registrationId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

  // Step 6: Format category-wise payment information
  const categoryPayments = verifications.map(
    (verification) => ({
      verificationId: verification.id,
      registrationId: verification.registrationId,
      categoryId: verification.registration.categoryId,
      categoryName: verification.registration.category?.name ?? 'Unknown Category',
categoryType: verification.registration.category?.type ?? null,
      registrationStatus: verification.registration.status,
      paymentStatus: verification.status,
      rejectionReason: verification.rejectionReason,
      verifiedAt: verification.verifiedAt,
      proofId: verification.proof?.id ?? null,
      proofUrl: verification.proof?.proofUrl ?? null,
      submittedAt: verification.proof?.submittedAt ?? null,
      canResubmit: verification.status === 'REJECTED',
    })
  );

  // Step 7: Return old fields + new category-wise details
  return {
    paymentProofRequired,
    isClubMember: player.isClubMember,
    registrationFee: tournament.registrationFee,
    paymentInstructions: tournament.paymentInstructions,
    paymentProof,
    categoryPayments,
  };
}

}