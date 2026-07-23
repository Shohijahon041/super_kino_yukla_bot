const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const movie = await p.movie.findFirst({
    select: { code: true, title: true, telegramFileId: true, cloudUrl: true }
  });
  console.log('First movie:', JSON.stringify(movie, null, 2));

  const count = await p.movie.count({ where: { telegramFileId: { not: null } } });
  console.log('Movies with telegramFileId:', count);

  const noFile = await p.movie.count({ where: { telegramFileId: null } });
  console.log('Movies without telegramFileId:', noFile);

  await p.$disconnect();
}
main();
