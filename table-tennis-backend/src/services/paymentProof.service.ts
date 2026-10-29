import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import fs from 'fs';
import path from 'path';

export class PaymentProofService {
  async submitPaymentProof(
    playerId: string,
    tournamentId: string,
    proofUrl: string
  ) {
    // 1. Find player
    const player = await prisma.playerProfile.findUnique({
      where: {
        userId: playerId,
      },
    });

    if (!player) {
      throw new AppError('Player profile not found', 404);
    }

    // 2. Find tournament
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }
    
// Singles: player must own the registration.
// Doubles/Mixed Doubles: player can be any member of the team.
const registrations = await prisma.tournamentRegistration.findMany({
  where: {
    tournamentId,
    status: {
      in: ['PENDING', 'REJECTED'],
    },
    OR: [
      // Singles / registration owner
      {
        playerId,
      },

      // Doubles / Mixed Doubles team member
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

  include: {
    team: {
      include: {
        members: {
          select: {
            playerId: true,
          },
        },
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        type: true,
      },
    },
  },
});

if (registrations.length === 0) {
  throw new AppError(
    'No pending tournament registration found for you or your team',
    404
  );
}


    //  For doubles/mixed doubles, only ONE payment proof is allowed
// for the team, regardless of which partner uploads it.
const teamRegistrations = registrations.filter(
  (registration) => registration.teamId !== null
);
const individualRegistrations = registrations.filter(
  (registration) => registration.teamId === null
);

// Determine payment requirement using the correct registration owner.
// For Singles: the logged-in player is the owner.
// For Doubles / Mixed Doubles: use the player who owns the team registration
// (the inviter/captain in our current registration flow).

let paymentRulePlayerId = playerId;

if (teamRegistrations.length > 0) {
  paymentRulePlayerId = teamRegistrations[0].playerId;
}

const paymentRulePlayer =
  await prisma.playerProfile.findUnique({
    where: {
      userId: paymentRulePlayerId,
    },
    select: {
      isClubMember: true,
    },
  });

if (!paymentRulePlayer) {
  throw new AppError(
    'Registration owner player profile not found',
    404
  );
}

const paymentProofRequired =
  paymentRulePlayer.isClubMember
    ? tournament.requirePaymentProofClub
    : tournament.requirePaymentProofGuest;

if (!paymentProofRequired) {
  throw new AppError(
    'Payment proof is not required for this registration',
    400
  );
}


    //  One proof per player per tournament.
    // If one already exists, replace it and return it to PENDING.
    
        let paymentProof;

// TEAM REGISTRATION: Doubles / Mixed Doubles
// TEAM REGISTRATION: Doubles / Mixed Doubles
// Each team member must submit their OWN payment proof.
if (teamRegistrations.length > 0) {
  const teamRegistration = teamRegistrations[0];

  // Find THIS player's proof for THIS team registration.
  const existingTeamProof =
    await prisma.tournamentPaymentProof.findUnique({
      where: {
        registrationId_playerId: {
          registrationId: teamRegistration.id,
          playerId,
        },
      },
    });

  if (existingTeamProof) {
    // This player's proof is already approved.
    if (existingTeamProof.status === 'APPROVED') {
      throw new AppError(
        'Your payment proof has already been approved',
        400
      );
    }

    // This player's proof is still waiting for admin verification.
    if (existingTeamProof.status === 'PENDING') {
      throw new AppError(
        'Your payment proof has already been submitted and is awaiting verification',
        400
      );
    }

    // REJECTED -> this same player can resubmit their own proof.
    paymentProof = await prisma.tournamentPaymentProof.update({
      where: {
        id: existingTeamProof.id,
      },
      data: {
        proofUrl,
        status: 'PENDING',
        submittedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
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
  } else {
    // First proof from this player for this doubles registration.
    paymentProof = await prisma.tournamentPaymentProof.create({
      data: {
        tournamentId,
        playerId,
        registrationId: teamRegistration.id,
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
  }
}

// INDIVIDUAL REGISTRATION: Singles
// INDIVIDUAL REGISTRATION: Singles
else {
  // Find this player's existing SINGLES proof.
  // registrationId must be null so that a doubles/mixed proof
  // uploaded by the same player is not confused with singles.
  const existingIndividualProof =
    await prisma.tournamentPaymentProof.findFirst({
      where: {
        tournamentId,
        playerId,
        registrationId: null,
      },
    });

  if (existingIndividualProof) {
    // Do not allow replacing an approved proof
    if (existingIndividualProof.status === 'APPROVED') {
      throw new AppError(
        'Your payment proof has already been approved',
        400
      );
    }

    // Do not replace a proof while admin is checking it
    if (existingIndividualProof.status === 'PENDING') {
      throw new AppError(
        'Your payment proof has already been submitted and is awaiting verification',
        400
      );
    }

    // REJECTED → allow resubmission
    paymentProof = await prisma.tournamentPaymentProof.update({
      where: {
        id: existingIndividualProof.id,
      },
      data: {
        proofUrl,
        status: 'PENDING',
        submittedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
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
  } else {
    // First singles proof submission
    paymentProof = await prisma.tournamentPaymentProof.create({
      data: {
        tournamentId,
        playerId,
        registrationId: null,
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
  }
}


 // If a proof is resubmitted after rejection,
// return the related registration to PENDING.
if (teamRegistrations.length > 0) {
  await prisma.tournamentRegistration.updateMany({
    where: {
      id: teamRegistrations[0].id,
      status: 'REJECTED',
    },
    data: {
      status: 'PENDING',
      rejectionReason: null,
      approvedBy: null,
      approvedAt: null,
    },
  });
} else {
  await prisma.tournamentRegistration.updateMany({
    where: {
      id: {
        in: individualRegistrations
          .filter(
            (registration) =>
              registration.status === 'REJECTED'
          )
          .map((registration) => registration.id),
      },
    },
    data: {
      status: 'PENDING',
      rejectionReason: null,
      approvedBy: null,
      approvedAt: null,
    },
  });
}

    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        select: { id: true },
      });

      if (admins.length > 0) {
        const playerName = `${paymentProof.player.firstName} ${paymentProof.player.lastName}`.trim();
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'PAYMENT_VERIFICATION_REQUEST',
            title: 'Payment Verification Request',
            message: `${playerName} submitted payment proof for ${paymentProof.tournament.name}.`,
          })),
        });
      }
    } catch (error) {
      console.error('Failed to notify admins about payment verification request:', error);
    }

    return paymentProof;
  }
  async getPendingPaymentProofs() {
  const paymentProofs =
    await prisma.tournamentPaymentProof.findMany({
      where: {
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
            playerProfile: {
              select: {
                isClubMember: true,
                gender: true,
              },
            },
          },
        },
      },

      orderBy: {
        submittedAt: 'asc',
      },
    });

  // Add the player's categories for each payment proof
  const result = await Promise.all(
    paymentProofs.map(async (proof) => {
      const registrations =
  await prisma.tournamentRegistration.findMany({
    where: proof.registrationId
      ? {
          // Doubles / Mixed Doubles:
          // use the exact team registration attached to the proof
          id: proof.registrationId,
          status: 'PENDING',
        }
      : {
          // Singles:
          // keep the existing player-based behaviour
          tournamentId: proof.tournamentId,
          playerId: proof.playerId,
          status: 'PENDING',
        },

    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

      return {
        ...proof,
        registrations,
      };
    })
  );

  return result;
}
async processPaymentProof(
  adminId: string,
  proofId: string,
  action: 'APPROVE' | 'REJECT',
  rejectionReason?: string
) {
  // 1. Verify admin
  const admin = await prisma.adminProfile.findUnique({
    where: {
      userId: adminId,
    },
  });

  if (!admin) {
    throw new AppError(
      'Only admins can process payment proofs',
      403
    );
  }

  // 2. Find payment proof
  const proof = await prisma.tournamentPaymentProof.findUnique({
    where: {
      id: proofId,
    },
    include: {
      tournament: true,
      player: true,
    },
  });

  if (!proof) {
    throw new AppError('Payment proof not found', 404);
  }

  if (proof.status !== 'PENDING') {
    throw new AppError(
      'Payment proof has already been processed',
      400
    );
  }

  // ============================================================
  // APPROVE
  // ============================================================

  if (action === 'APPROVE') {

  // ============================================================
  // DOUBLES / MIXED DOUBLES
  // ============================================================
  if (proof.registrationId) {
    const registration =
      await prisma.tournamentRegistration.findUnique({
        where: {
          id: proof.registrationId,
        },
        include: {
          category: true,
          team: {
            include: {
              members: {
                where: {
                  isActive: true,
                },
                select: {
                  playerId: true,
                },
              },
            },
          },
        },
      });

    if (!registration) {
      throw new AppError(
        'Tournament registration not found',
        404
      );
    }

    if (!registration.team) {
      throw new AppError(
        'Team not found for this registration',
        404
      );
    }

    // First approve THIS player's proof.
    const updatedProof =
      await prisma.tournamentPaymentProof.update({
        where: {
          id: proofId,
        },
        data: {
          status: 'APPROVED',
          verifiedBy: adminId,
          verifiedAt: new Date(),
          rejectionReason: null,
        },
      });

    const activeMemberIds = registration.team.members.map(
      (member) => member.playerId
    );

    // Get all approved proofs belonging to this team registration.
    const approvedProofs =
      await prisma.tournamentPaymentProof.findMany({
        where: {
          registrationId: registration.id,
          status: 'APPROVED',
          playerId: {
            in: activeMemberIds,
          },
        },
        select: {
          playerId: true,
        },
      });

    const approvedPlayerIds = new Set(
      approvedProofs.map((item) => item.playerId)
    );

    // Every active team member must have an approved proof.
    const allMembersApproved = activeMemberIds.every(
      (memberId) => approvedPlayerIds.has(memberId)
    );

    // Player A approved but Player B not approved yet.
    if (!allMembersApproved) {
      return updatedProof;
    }

    // Both players are approved.
    // Now check category capacity.
    if (
      registration.category &&
      registration.category.currentParticipants >=
        registration.category.maxParticipants
    ) {
      throw new AppError(
        `Category "${registration.category.name}" is already full`,
        400
      );
    }

    // Prevent accidentally incrementing category count twice.
    if (registration.status !== 'APPROVED') {
      await prisma.tournamentRegistration.update({
        where: {
          id: registration.id,
        },
        data: {
          status: 'APPROVED',
          approvedBy: adminId,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      });

      if (registration.categoryId) {
        await prisma.category.update({
          where: {
            id: registration.categoryId,
          },
          data: {
            currentParticipants: {
              increment: 1,
            },
          },
        });
      }
    }

    return updatedProof;
  }

  // ============================================================
  // SINGLES - EXISTING BEHAVIOUR
  // ============================================================

  const registrations =
    await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId: proof.tournamentId,
        playerId: proof.playerId,
        status: 'PENDING',
      },
      include: {
        category: true,
      },
    });

  if (registrations.length === 0) {
    throw new AppError(
      'No pending registrations found for this payment proof',
      404
    );
  }

  // Check category capacity first.
  for (const registration of registrations) {
    if (
      registration.category &&
      registration.category.currentParticipants >=
        registration.category.maxParticipants
    ) {
      throw new AppError(
        `Category "${registration.category.name}" is already full`,
        400
      );
    }
  }

  // Singles registration can be approved immediately.
  for (const registration of registrations) {
    await prisma.tournamentRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    if (registration.categoryId) {
      await prisma.category.update({
        where: {
          id: registration.categoryId,
        },
        data: {
          currentParticipants: {
            increment: 1,
          },
        },
      });
    }
  }

  const updatedProof =
    await prisma.tournamentPaymentProof.update({
      where: {
        id: proofId,
      },
      data: {
        status: 'APPROVED',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    });

  return updatedProof;
}

  // ============================================================
  // REJECT
  // ============================================================

  if (!rejectionReason?.trim()) {
    throw new AppError(
      'Rejection reason is required',
      400
    );
  }

  // For Singles, rejection keeps the existing registration behaviour.
// For Doubles/Mixed Doubles, the team remains PENDING while the
// rejected player corrects and resubmits their own proof.
if (!proof.registrationId) {
  await prisma.tournamentRegistration.updateMany({
    where: {
      tournamentId: proof.tournamentId,
      playerId: proof.playerId,
      status: 'PENDING',
    },
    data: {
      status: 'REJECTED',
      approvedBy: adminId,
      approvedAt: new Date(),
      rejectionReason: rejectionReason.trim(),
    },
  });
}
  // Reject payment proof
  const updatedProof =
    await prisma.tournamentPaymentProof.update({
      where: {
        id: proofId,
      },
      data: {
        status: 'REJECTED',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
      },
    });

  return updatedProof;
}
async deleteMyPaymentProof(
  playerId: string,
  proofId: string
) {
  // Find the proof and make sure it belongs to this player
  const paymentProof =
    await prisma.tournamentPaymentProof.findFirst({
      where: {
        id: proofId,
        playerId
      }
    });

  if (!paymentProof) {
    throw new AppError(
      'Payment proof not found or you do not have permission to delete it',
      404
    );
  }

  // Never allow an approved proof to be deleted
  if (paymentProof.status === 'APPROVED') {
    throw new AppError(
      'Approved payment proofs cannot be deleted',
      400
    );
  }

  // Delete the database record
  await prisma.tournamentPaymentProof.delete({
    where: {
      id: paymentProof.id
    }
  });

  // Delete the uploaded file from the server
  try {
    const relativePath =
      paymentProof.proofUrl.replace(/^\/+/, '');

    const filePath = path.join(
      process.cwd(),
      relativePath
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      'Failed to delete payment proof file:',
      error
    );
  }

  return {
    id: paymentProof.id
  };
}
async getMyPaymentProof(
  playerId: string,
  tournamentId: string
) {
  // Make sure the logged-in user has a player profile
  const player = await prisma.playerProfile.findUnique({
    where: {
      userId: playerId,
    },
  });

  if (!player) {
    throw new AppError('Player profile not found', 404);
  }

  // Make sure tournament exists
  const tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId,
    },
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

  // Determine whether THIS player needs payment proof
  const paymentProofRequired = player.isClubMember
    ? tournament.requirePaymentProofClub
    : tournament.requirePaymentProofGuest;

 // Find ONLY this player's own payment proof.
// This works for both Singles and Doubles/Mixed Doubles.
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
  return {
    paymentProofRequired,
    isClubMember: player.isClubMember,
    registrationFee: tournament.registrationFee,
    paymentInstructions: tournament.paymentInstructions,
    paymentProof,
  };
}
}