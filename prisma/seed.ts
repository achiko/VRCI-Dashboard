import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Add first whitelisted wallet (you can change this address)
  const firstWhitelistedAddress = process.env.FIRST_WHITELISTED_ADDRESS || '5Dc2AZgBtFERxPqVxhxMfmeKQt8BMfxSeMyxQCyCxqy35e1a'; // Alice

  // Check if already exists
  const existing = await prisma.whitelist.findUnique({
    where: { address: firstWhitelistedAddress },
  });

  if (existing) {
    console.log(`✅ Wallet ${firstWhitelistedAddress} is already whitelisted`);
  } else {
    await prisma.whitelist.create({
      data: {
        address: firstWhitelistedAddress,
        note: 'Initial whitelisted wallet (seed script)',
      },
    });
    console.log(`✅ Added whitelisted wallet: ${firstWhitelistedAddress}`);
  }

  console.log('✨ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

