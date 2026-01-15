const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const uniqueSuffix = Date.now();

  try {
    const user = await prisma.user.create({
      data: { name: `Test User ${uniqueSuffix}` },
    });

    const player = await prisma.player.create({
      data: {
        name: `Contract Player ${uniqueSuffix}`,
        position: 'CM',
        age: 24,
        overall: 72,
        potential: 80,
      },
    });

    const team = await prisma.team.create({
      data: { name: `Contract Team ${uniqueSuffix}` },
    });

    const createdContract = await prisma.contract.create({
      data: {
        userId: user.id,
        playerId: player.id,
        teamId: team.id,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        wage: 5000,
      },
    });

    if (!createdContract.userId || !createdContract.playerId || !createdContract.teamId) {
      throw new Error('Contract relations were not persisted');
    }

    const otherUser = await prisma.user.create({
      data: { name: `Other User ${uniqueSuffix}` },
    });

    await prisma.contract.create({
      data: {
        userId: otherUser.id,
        playerId: player.id,
        teamId: team.id,
        startDate: new Date('2026-02-01T00:00:00.000Z'),
        endDate: new Date('2026-12-01T00:00:00.000Z'),
        wage: 6000,
      },
    });

    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
    });

    if (!userContracts.every((contract) => contract.userId === user.id)) {
      throw new Error('Contract query did not scope by userId');
    }

    let missingTeamIdFailed = false;
    try {
      await prisma.contract.create({
        data: {
          userId: user.id,
          playerId: player.id,
          startDate: new Date('2026-03-01T00:00:00.000Z'),
          endDate: new Date('2026-10-01T00:00:00.000Z'),
          wage: 7000,
        },
      });
    } catch (error) {
      missingTeamIdFailed = true;
    }

    if (!missingTeamIdFailed) {
      throw new Error('Contract creation should fail when teamId is missing');
    }

    console.log('contract-schema.test.js passed (schema checks).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
