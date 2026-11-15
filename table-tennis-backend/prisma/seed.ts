import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================
  // 1. SUPER ADMIN
  // ============================================================
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@tabletennis.com',
    },
    update: {
      password: adminPassword,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      isEmailVerified: true,
    },
    create: {
      email: 'admin@tabletennis.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+94771234567',
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      isEmailVerified: true,

      adminProfile: {
        create: {
          department: 'Tournament Management',
        },
      },
    },
    include: {
      adminProfile: true,
    },
  });

  // Ensure adminProfile exists even if the user already existed
  if (!admin.adminProfile) {
    await prisma.adminProfile.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        department: 'Tournament Management',
      },
    });
  }

  console.log('✅ Super Admin ready:', admin.email);

  // ============================================================
  // 2. OFFICIAL REFEREE
  // ============================================================
  const refereePassword = await bcrypt.hash('referee123', 10);

  const referee = await prisma.user.upsert({
    where: {
      email: 'referee@tabletennis.com',
    },
    update: {
      password: refereePassword,
      role: 'REFEREE',
      isEmailVerified: true,
    },
    create: {
      email: 'referee@tabletennis.com',
      password: refereePassword,
      firstName: 'Referee',
      lastName: 'User',
      phone: '+94771234568',
      role: 'REFEREE',
      isEmailVerified: true,

      refereeProfile: {
        create: {
          certification: 'ITTF Level 2',
          experienceYears: 5,
        },
      },
    },
    include: {
      refereeProfile: true,
    },
  });

  // Ensure refereeProfile exists even if the user already existed
  if (!referee.refereeProfile) {
    await prisma.refereeProfile.upsert({
      where: { userId: referee.id },
      update: {},
      create: {
        userId: referee.id,
        certification: 'ITTF Level 2',
        experienceYears: 5,
      },
    });
  }

  console.log('✅ Official Referee ready:', referee.email);

  console.log('\n==============================================');
  console.log('🎉 Seed completed successfully!');
  console.log('==============================================');
  console.log('🔐 Accounts available:');
  console.log('   Admin   : admin@tabletennis.com   / admin123');
  console.log('   Referee : referee@tabletennis.com / referee123');
  console.log('==============================================\n');
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