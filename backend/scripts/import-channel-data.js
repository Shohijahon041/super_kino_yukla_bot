const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

const prisma = new PrismaClient();
const sqliteDb = new Database(path.resolve('C:/Users/User/kino-bot/kino.db'));

async function main() {
  console.log('📥 Updating movies with channelMessageId and channelId...\n');

  const movies = sqliteDb.prepare('SELECT code, message_id, chat_id FROM movies').all();
  console.log(`Found ${movies.length} movies in SQLite\n`);

  let updated = 0;
  const BATCH = 100;

  for (let i = 0; i < movies.length; i += BATCH) {
    const batch = movies.slice(i, i + BATCH);

    for (const m of batch) {
      if (!m.message_id || !m.chat_id) continue;

      try {
        await prisma.movie.update({
          where: { code: m.code },
          data: {
            channelMessageId: m.message_id,
            channelId: BigInt(m.chat_id),
          },
        });
        updated++;
      } catch (e) {
        // skip
      }
    }

    if (updated % 500 === 0) {
      console.log(`  ✅ ${updated}/${movies.length} updated...`);
    }
  }

  console.log(`\n🎉 Updated ${updated} movies with channel data`);

  await prisma.$disconnect();
  sqliteDb.close();
}

main().catch(console.error);
