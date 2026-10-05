import prisma from '../config/database';
import { AppError } from '../utils/AppError';

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


    // 5. For doubles/mixed doubles, only ONE payment proof is allowed
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

// 5. Check existing payment proof for team registrations
for (const registration of teamRegistrations) {
  const existingTeamProof =
    await prisma.tournamentPaymentProof.findUnique({
      where: {
        registrationId: registration.id,
      },
    });

  if (existingTeamProof) {
    // Once approved, nobody can upload another proof
    if (existingTeamProof.status === 'APPROVED') {
      throw new AppError(
        'Payment for this team has already been approved',
        400
      );
    }

    // While admin verification is pending,
    // neither partner can replace the current proof
    if (existingTeamProof.status === 'PENDING') {
      throw new AppError(
        'A payment proof has already been submitted for this team and is awaiting verification',
        400
      );
    }

    // REJECTED is intentionally allowed.
    // Either partner will be able to submit the corrected proof.
  }
}
    //  One proof per player per tournament.
    // If one already exists, replace it and return it to PENDING.
    
        let paymentProof;

// TEAM REGISTRATION: Doubles / Mixed Doubles
if (teamRegistrations.length > 0) {
  const teamRegistration = teamRegistrations[0];

  const existingTeamProof =
    await prisma.tournamentPaymentProof.findUnique({
      where: {
        registrationId: teamRegistration.id,
      },
    });

  if (existingTeamProof) {
    // At this point it should be REJECTED,
    // because PENDING and APPROVED were blocked above.
    paymentProof = await prisma.tournamentPaymentProof.update({
      where: {
        id: existingTeamProof.id,
      },
      data: {
        // Whoever resubmits becomes the current uploader
        playerId,
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


    // If this is a resubmission after rejection,
// return the player's own registration OR team registration to PENDING.
await prisma.tournamentRegistration.updateMany({
  where: teamRegistrations.length > 0
    ? {
        // Doubles / Mixed Doubles:
        // reset only the exact team registration used for this proof
        id: teamRegistrations[0].id,
        status: 'REJECTED',
      }
    : {
        // Singles:
        // reset this player's rejected individual registrations
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
    const registrations =
  await prisma.tournamentRegistration.findMany({
    where: proof.registrationId
      ? {
          // Doubles / Mixed Doubles:
          // approve only the exact team registration
          id: proof.registrationId,
          status: 'PENDING',
        }
      : {
          // Singles:
          // approve this player's pending registrations
          tournamentId: proof.tournamentId,
          playerId: proof.playerId,
          status: 'PENDING',
        },

    include: {
      category: true,
      team: {
        include: {
          members: {
            select: {
              playerId: true,
            },
          },
        },
      },
    },
  });
    if (registrations.length === 0) {
      throw new AppError(
        'No pending registrations found for this payment proof',
        404
      );
    }

    // Check category capacity BEFORE making changes
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

    // Approve registrations
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

      // Count participant only now
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

    // Approve payment proof
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

  // Mark related pending registrations as rejected
  // Mark the related registration(s) as rejected
await prisma.tournamentRegistration.updateMany({
  where: proof.registrationId
    ? {
        // Doubles / Mixed Doubles:
        // reject only the exact team registration
        id: proof.registrationId,
        status: 'PENDING',
      }
    : {
        // Singles:
        // reject this player's pending registrations
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

  // Find payment proof accessible to this player.
// Singles: player's own proof.
// Doubles / Mixed Doubles: proof belonging to a team
// registration where this player is an active team member.
const paymentProof =
  await prisma.tournamentPaymentProof.findFirst({
    where: {
      tournamentId,

      OR: [
        // Singles / proof uploaded by this player
        {
          playerId,
        },

        // Doubles / Mixed Doubles
        {
          registration: {
            team: {
              members: {
                some: {
                  playerId,
                  isActive: true,
                },
              },
            },
          },
        },
      ],
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