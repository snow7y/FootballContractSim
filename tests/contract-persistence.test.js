const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const uniqueSuffix = Date.now();

  try {
    const user = await prisma.user.create({
      data: { name: `Persist User ${uniqueSuffix}` },
    });
    const otherUser = await prisma.user.create({
      data: { name: `Persist Other ${uniqueSuffix}` },
    });

    const player = await prisma.player.create({
      data: {
        name: `Persist Player ${uniqueSuffix}`,
        position: 'CM',
        age: 23,
        overall: 70,
        potential: 78,
      },
    });

    const team = await prisma.team.create({
      data: { name: `Persist Team ${uniqueSuffix}` },
    });

    const contract = await prisma.contract.create({
      data: {
        userId: user.id,
        playerId: player.id,
        teamId: team.id,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        wage: 4500,
      },
    });

    await prisma.contract.create({
      data: {
        userId: otherUser.id,
        playerId: player.id,
        teamId: team.id,
        startDate: new Date('2026-02-01T00:00:00.000Z'),
        endDate: new Date('2026-10-01T00:00:00.000Z'),
        wage: 5200,
      },
    });

    if (contract.userId !== user.id) {
      throw new Error('Contract userId should match the creator');
    }

    const scopedContracts = await prisma.contract.findMany({
      where: { userId: user.id },
    });

    if (!scopedContracts.find((item) => item.id === contract.id)) {
      throw new Error('Created contract should be present in scoped query');
    }
    if (!scopedContracts.every((item) => item.userId === user.id)) {
      throw new Error('Scoped query should only return contracts for the user');
    }

    console.log('contract-persistence.test.js passed (persistence checks).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
