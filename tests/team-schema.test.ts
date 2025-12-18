import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    // RED phase: this will fail until Team モデルとテーブルが定義されている想定
    const created = await prisma.team.create({
      data: { name: 'Test Team' },
    });
    const found = await prisma.team.findUnique({ where: { id: created.id } });
    if (!found || found.name !== 'Test Team') {
      throw new Error('Team creation/read invariant violated');
    }
    // GREEN: Team テーブルに対する基本的な create/findUnique が動作することを期待
    // 実行時にここまで到達すればテスト成功とみなす
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
