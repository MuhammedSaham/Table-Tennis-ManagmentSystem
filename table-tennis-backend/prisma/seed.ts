import {
  PrismaClient,
  Gender,
  CategoryType,
  RegistrationStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Mixed Doubles test seed...\n');

  // ============================================================
  // 1. ADMIN
  // ============================================================

  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@tabletennis.com',
    },
    update: {},
    create: {
      email: 'admin@tabletennis.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+94771234567',
      role: 'ADMIN',
      isSuperAdmin: true,

      adminProfile: {
        create: {
          department: 'Tournament Management',
        },
      },
    },
  });

  console.log('✅ Admin:', admin.email);

  // ============================================================
  // 2. REFEREE
  // ============================================================

  const refereePassword = await bcrypt.hash('referee123', 10);

  const referee = await prisma.user.upsert({
    where: {
      email: 'referee@tabletennis.com',
    },
    update: {},
    create: {
      email: 'referee@tabletennis.com',
      password: refereePassword,
      firstName: 'Referee',
      lastName: 'User',
      phone: '+94771234568',
      role: 'REFEREE',

      refereeProfile: {
        create: {
          certification: 'ITTF Level 2',
          experienceYears: 5,
        },
      },
    },
  });

  console.log('✅ Referee:', referee.email);

  // ============================================================
  // 3. TEST PLAYERS
  // ============================================================

  const playerPassword = await bcrypt.hash('player123', 10);

  const players = [
    // ---------------- MALE PLAYERS ----------------
    {
      email: 'male01@test.com',
      firstName: 'Male',
      lastName: 'Player01',
      gender: Gender.MALE,
      ranking: 1,
    },
    {
      email: 'male02@test.com',
      firstName: 'Male',
      lastName: 'Player02',
      gender: Gender.MALE,
      ranking: 2,
    },
    {
      email: 'male03@test.com',
      firstName: 'Male',
      lastName: 'Player03',
      gender: Gender.MALE,
      ranking: 3,
    },
    {
      email: 'male04@test.com',
      firstName: 'Male',
      lastName: 'Player04',
      gender: Gender.MALE,
      ranking: 4,
    },
    {
      email: 'male05@test.com',
      firstName: 'Male',
      lastName: 'Player05',
      gender: Gender.MALE,
      ranking: 5,
    },
    {
      email: 'male06@test.com',
      firstName: 'Male',
      lastName: 'Player06',
      gender: Gender.MALE,
      ranking: 6,
    },
    {
      email: 'male07@test.com',
      firstName: 'Male',
      lastName: 'Player07',
      gender: Gender.MALE,
      ranking: 7,
    },
    {
      email: 'male08@test.com',
      firstName: 'Male',
      lastName: 'Player08',
      gender: Gender.MALE,
      ranking: 8,
    },

    // ---------------- FEMALE PLAYERS ----------------
    {
      email: 'female01@test.com',
      firstName: 'Female',
      lastName: 'Player01',
      gender: Gender.FEMALE,
      ranking: 9,
    },
    {
      email: 'female02@test.com',
      firstName: 'Female',
      lastName: 'Player02',
      gender: Gender.FEMALE,
      ranking: 10,
    },
    {
      email: 'female03@test.com',
      firstName: 'Female',
      lastName: 'Player03',
      gender: Gender.FEMALE,
      ranking: 11,
    },
    {
      email: 'female04@test.com',
      firstName: 'Female',
      lastName: 'Player04',
      gender: Gender.FEMALE,
      ranking: 12,
    },
    {
      email: 'female05@test.com',
      firstName: 'Female',
      lastName: 'Player05',
      gender: Gender.FEMALE,
      ranking: 13,
    },
    {
      email: 'female06@test.com',
      firstName: 'Female',
      lastName: 'Player06',
      gender: Gender.FEMALE,
      ranking: 14,
    },
    {
      email: 'female07@test.com',
      firstName: 'Female',
      lastName: 'Player07',
      gender: Gender.FEMALE,
      ranking: 15,
    },
    {
      email: 'female08@test.com',
      firstName: 'Female',
      lastName: 'Player08',
      gender: Gender.FEMALE,
      ranking: 16,
    },
  ];

  const createdPlayers: any[] = [];

  for (const player of players) {
    const user = await prisma.user.upsert({
      where: {
        email: player.email,
      },

      update: {
        firstName: player.firstName,
        lastName: player.lastName,
      },

      create: {
        email: player.email,
        password: playerPassword,
        firstName: player.firstName,
        lastName: player.lastName,
        role: 'PLAYER',

        playerProfile: {
          create: {
            gender: player.gender,
            ranking: player.ranking,
            skillLevel: 'Intermediate',
            clubAffiliation: 'Test Table Tennis Academy',
          },
        },
      },

      include: {
        playerProfile: true,
      },
    });

    // Make sure existing player's profile is also updated
    if (user.playerProfile) {
      await prisma.playerProfile.update({
        where: {
          id: user.playerProfile.id,
        },
        data: {
          gender: player.gender,
          ranking: player.ranking,
        },
      });
    } else {
      await prisma.playerProfile.create({
        data: {
          userId: user.id,
          gender: player.gender,
          ranking: player.ranking,
          skillLevel: 'Intermediate',
          clubAffiliation: 'Test Table Tennis Academy',
        },
      });
    }

    const playerWithProfile = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        playerProfile: true,
      },
    });

    createdPlayers.push(playerWithProfile);

    console.log(
      `✅ Player: ${player.firstName} ${player.lastName} - ${player.gender}`
    );
  }

  // ============================================================
  // 4. FIND EXISTING TOURNAMENT
  // ============================================================

  const tournament = await prisma.tournament.findFirst({
    where: {
      name: 'Double Smash',
    },
  });

  if (!tournament) {
    throw new Error(
      '❌ Tournament "Double Smash" was not found. Please create it first from the admin panel.'
    );
  }

  console.log('\n🏆 Tournament found:', tournament.name);
  console.log('Tournament ID:', tournament.id);

  // ============================================================
  // 5. FIND / CREATE MIXED DOUBLES CATEGORY
  // ============================================================

  let category = await prisma.category.findFirst({
    where: {
      tournamentId: tournament.id,
      type: CategoryType.MIXED_DOUBLES,
    },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        tournamentId: tournament.id,

        name: 'Mixed Doubles',

        type: CategoryType.MIXED_DOUBLES,

        gender: Gender.MIXED,

        maxParticipants: 8,

        currentParticipants: 0,
      },
    });

    console.log('✅ Mixed Doubles category created');
  } else {
    console.log('ℹ️ Mixed Doubles category already exists');
  }

  // ============================================================
  // 6. GET MALE AND FEMALE PLAYERS
  // ============================================================

  const malePlayers = createdPlayers
    .filter(
      (player) =>
        player?.playerProfile?.gender === Gender.MALE
    )
    .sort(
      (a, b) =>
        (a.playerProfile?.ranking ?? 999) -
        (b.playerProfile?.ranking ?? 999)
    );

  const femalePlayers = createdPlayers
    .filter(
      (player) =>
        player?.playerProfile?.gender === Gender.FEMALE
    )
    .sort(
      (a, b) =>
        (a.playerProfile?.ranking ?? 999) -
        (b.playerProfile?.ranking ?? 999)
    );

  console.log(`\n👨 Male players   : ${malePlayers.length}`);
  console.log(`👩 Female players : ${femalePlayers.length}`);

  if (malePlayers.length !== 8 || femalePlayers.length !== 8) {
    throw new Error(
      '❌ Expected 8 male players and 8 female players.'
    );
  }

  // ============================================================
  // 7. CREATE 8 MIXED DOUBLES TEAMS
  // ============================================================

  const teams: any[] = [];

  for (let i = 0; i < 8; i++) {
    const male = malePlayers[i];
    const female = femalePlayers[i];

    const teamName = `Mixed Team ${String(i + 1).padStart(2, '0')}`;

    let team = await prisma.team.findFirst({
      where: {
        tournamentId: tournament.id,
        name: teamName,
      },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: teamName,

          tournamentId: tournament.id,

          // Male player is the captain
          captainId: male.id,

          members: {
            create: [
              {
                playerId: male.id,
                playerProfileId: male.playerProfile?.id,
                isActive: true,
              },
              {
                playerId: female.id,
                playerProfileId: female.playerProfile?.id,
                isActive: true,
              },
            ],
          },
        },
      });

      console.log(
        `🤝 Created ${teamName}: ${male.firstName} ${male.lastName} + ${female.firstName} ${female.lastName}`
      );
    } else {
      console.log(`ℹ️ ${teamName} already exists`);
    }

    teams.push(team);
  }

  // ============================================================
  // 8. REGISTER TEAMS IN MIXED DOUBLES CATEGORY
  // ============================================================

  for (const team of teams) {
    const existingRegistration =
      await prisma.tournamentRegistration.findFirst({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          teamId: team.id,
        },
      });

    if (!existingRegistration) {
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,

          categoryId: category.id,

          // TournamentRegistration requires playerId.
          // We use the team captain as the primary player.
          playerId: team.captainId,

          teamId: team.id,

          status: RegistrationStatus.APPROVED,

          approvedBy: admin.id,

          approvedAt: new Date(),
        },
      });

      console.log(`📝 Registered: ${team.name}`);
    } else {
      console.log(`ℹ️ ${team.name} already registered`);
    }
  }

  // ============================================================
  // 9. UPDATE CATEGORY PARTICIPANT COUNT
  // ============================================================

  await prisma.category.update({
    where: {
      id: category.id,
    },
    data: {
      currentParticipants: teams.length,
    },
  });

  // ============================================================
  // 10. SUMMARY
  // ============================================================

  console.log('\n');
  console.log('==============================================');
  console.log('🎉 MIXED DOUBLES TEST DATA READY');
  console.log('==============================================');

  console.log(`🏆 Tournament : ${tournament.name}`);
  console.log(`📂 Category   : ${category.name}`);
  console.log(`📌 Type       : ${category.type}`);
  console.log(`🏓 Tournament : ${tournament.tournamentType}`);
  console.log(`👥 Teams      : ${teams.length}`);
  console.log(`👨 Male       : ${malePlayers.length}`);
  console.log(`👩 Female     : ${femalePlayers.length}`);

  console.log('\n🔐 TEST PLAYER PASSWORD');
  console.log('Password for ALL test players: player123');

  console.log('\n📧 PLAYER ACCOUNTS');

  for (const player of createdPlayers) {
    console.log(`${player.email} / player123`);
  }

  console.log('\n🤝 MIXED DOUBLES TEAMS');

  for (let i = 0; i < 8; i++) {
    console.log(
      `Team ${i + 1}: ${malePlayers[i].email} + ${femalePlayers[i].email}`
    );
  }

  console.log('\n==============================================');
  console.log('✅ Seed completed successfully!');
  console.log('==============================================');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });