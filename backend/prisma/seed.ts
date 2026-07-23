import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Roles
  const superAdmin = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      description: 'Super Administrator with full access',
      permissions: {
        create: [
          { resource: 'movies', action: 'create' },
          { resource: 'movies', action: 'read' },
          { resource: 'movies', action: 'update' },
          { resource: 'movies', action: 'delete' },
          { resource: 'series', action: 'create' },
          { resource: 'series', action: 'read' },
          { resource: 'series', action: 'update' },
          { resource: 'series', action: 'delete' },
          { resource: 'users', action: 'read' },
          { resource: 'users', action: 'update' },
          { resource: 'users', action: 'delete' },
          { resource: 'admin', action: 'dashboard' },
          { resource: 'admin', action: 'broadcast' },
          { resource: 'admin', action: 'import' },
          { resource: 'admin', action: 'export' },
          { resource: 'statistics', action: 'read' },
        ],
      },
    },
  });

  const admin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator',
      permissions: {
        create: [
          { resource: 'movies', action: 'create' },
          { resource: 'movies', action: 'read' },
          { resource: 'movies', action: 'update' },
          { resource: 'series', action: 'create' },
          { resource: 'series', action: 'read' },
          { resource: 'series', action: 'update' },
          { resource: 'users', action: 'read' },
          { resource: 'admin', action: 'dashboard' },
        ],
      },
    },
  });

  const moderator = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: {
      name: 'moderator',
      description: 'Moderator',
      permissions: {
        create: [
          { resource: 'movies', action: 'read' },
          { resource: 'movies', action: 'update' },
          { resource: 'series', action: 'read' },
          { resource: 'series', action: 'update' },
          { resource: 'users', action: 'read' },
        ],
      },
    },
  });

  const user = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user',
      permissions: {
        create: [
          { resource: 'movies', action: 'read' },
          { resource: 'series', action: 'read' },
        ],
      },
    },
  });

  console.log('✅ Roles created');

  // Genres
  const genres = [
    { name: 'Jangari', slug: 'jangari', emoji: '⚔️' },
    { name: 'Komediya', slug: 'komediya', emoji: '😂' },
    { name: 'Drama', slug: 'drama', emoji: '🎭' },
    { name: 'Xorror', slug: 'xorror', emoji: '👻' },
    { name: 'Triller', slug: 'triller', emoji: '🔪' },
    { name: 'Romantik', slug: 'romantik', emoji: '❤️' },
    { name: 'Tarixiy', slug: 'tarixiy', emoji: '📜' },
    { name: 'Animatsiya', slug: 'animatsiya', emoji: '🎨' },
    { name: 'Fantastika', slug: 'fantastika', emoji: '🚀' },
    { name: 'Sarguzasht', slug: 'sarguzasht', emoji: '🗺️' },
    { name: 'Oilaviy', slug: 'oilaviy', emoji: '👨‍👩‍👧‍👦' },
    { name: 'Hujjatli', slug: 'hujjatli', emoji: '📹' },
    { name: 'Harbiy', slug: 'harbiy', emoji: '🎖️' },
    { name: 'Jinoyat', slug: 'jinoyat', emoji: '🔫' },
    { name: 'Superqahramon', slug: 'superqahramon', emoji: '🦸' },
    { name: 'Anime', slug: 'anime', emoji: '🎌' },
    { name: 'Multfilm', slug: 'multfilm', emoji: '🎨' },
    { name: 'Serial', slug: 'serial', emoji: '📺' },
    { name: 'Musiqa', slug: 'musiqa', emoji: '🎵' },
    { name: 'Sport', slug: 'sport', emoji: '⚽' },
  ];

  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: genre,
    });
  }
  console.log('✅ Genres created');

  // Countries
  const countries = [
    { name: "O'zbekiston", code: 'UZ', flag: '🇺🇿' },
    { name: 'AQSH', code: 'US', flag: '🇺🇸' },
    { name: 'Rossiya', code: 'RU', flag: '🇷🇺' },
    { name: 'Janubiy Koreya', code: 'KR', flag: '🇰🇷' },
    { name: 'Yaponiya', code: 'JP', flag: '🇯🇵' },
    { name: 'Turkiya', code: 'TR', flag: '🇹🇷' },
    { name: 'Hindiston', code: 'IN', flag: '🇮🇳' },
    { name: 'Xitoy', code: 'CN', flag: '🇨🇳' },
    { name: 'Buyuk Britaniya', code: 'GB', flag: '🇬🇧' },
    { name: 'Germaniya', code: 'DE', flag: '🇩🇪' },
    { name: 'Fransiya', code: 'FR', flag: '🇫🇷' },
    { name: 'Italiya', code: 'IT', flag: '🇮🇹' },
    { name: 'Ispaniya', code: 'ES', flag: '🇪🇸' },
    { name: 'Kanada', code: 'CA', flag: '🇨🇦' },
    { name: 'Avstraliya', code: 'AU', flag: '🇦🇺' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log('✅ Countries created');

  // Languages
  const languages = [
    { name: "O'zbekcha", code: 'uz' },
    { name: 'Ruscha', code: 'ru' },
    { name: 'Inglizcha', code: 'en' },
    { name: 'Koreycha', code: 'ko' },
    { name: 'Yaponcha', code: 'ja' },
    { name: 'Turkcha', code: 'tr' },
    { name: 'Hindcha', code: 'hi' },
    { name: 'Xitoycha', code: 'zh' },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }
  console.log('✅ Languages created');

  // Content Categories
  const categories = [
    { name: 'Filmlar', slug: 'filmlar', icon: '🎬', order: 1 },
    { name: 'Seriallar', slug: 'seriallar', icon: '📺', order: 2 },
    { name: 'Animelar', slug: 'animelar', icon: '🎌', order: 3 },
    { name: 'Multfilmlar', slug: 'multfilmlar', icon: '🎨', order: 4 },
    { name: 'Hujjatli filmlar', slug: 'hujjatli-filmlar', icon: '📹', order: 5 },
    { name: 'TV shoular', slug: 'tv-shoular', icon: '🎙️', order: 6 },
    { name: 'Konsertlar', slug: 'konsertlar', icon: '🎵', order: 7 },
    { name: 'Sport lavhalar', slug: 'sport-lavhalar', icon: '⚽', order: 8 },
    { name: 'Podcastlar', slug: 'podcastlar', icon: '🎧', order: 9 },
    { name: 'Audiokitoblar', slug: 'audiokitoblar', icon: '📚', order: 10 },
  ];

  for (const cat of categories) {
    await prisma.contentCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Content categories created');

  // Missions
  const missions = [
    { name: 'Kunlik bonus', description: 'Kunlik bonusni oling', type: 'daily', target: 1, reward: 50, coinReward: 100, icon: '🎁' },
    { name: '3 ta film tomosha qiling', description: '3 ta film tomosha qiling', type: 'daily', target: 3, reward: 150, coinReward: 200, icon: '🎬' },
    { name: '5 ta qidiruv', description: '5 ta film qidiring', type: 'daily', target: 5, reward: 50, coinReward: 50, icon: '🔍' },
    { name: '1 ta izoh yozing', description: '1 ta filmga izoh yozing', type: 'daily', target: 1, reward: 100, coinReward: 100, icon: '💬' },
    { name: 'Haftalik 20 ta film', description: '20 ta film tomosha qiling', type: 'weekly', target: 20, reward: 500, coinReward: 1000, icon: '🏆' },
    { name: 'Do\'st taklif qiling', description: '1 ta do\'st taklif qiling', type: 'weekly', target: 1, reward: 300, coinReward: 500, icon: '👥' },
    { name: '7 kunlik streak', description: '7 kun ketma-ket bonus oling', type: 'special', target: 7, reward: 1000, coinReward: 2000, icon: '🔥' },
  ];

  for (const mission of missions) {
    const existing = await prisma.mission.findFirst({ where: { name: mission.name } });
    if (!existing) {
      await prisma.mission.create({ data: mission });
    }
  }
  console.log('✅ Missions created');

  // Achievements
  const achievements = [
    { name: 'Boshlang\'ich', description: 'Platformaga qo\'shiling', icon: '🌟', tier: 'bronze', xpReward: 100, coinReward: 50, condition: { type: 'join', value: 1 } },
    { name: 'Film sevuvchi', description: '10 ta film tomosha qiling', icon: '🎬', tier: 'bronze', xpReward: 200, coinReward: 100, condition: { type: 'watch_count', value: 10 } },
    { name: 'Kino mutaxassisi', description: '100 ta film tomosha qiling', icon: '🎓', tier: 'silver', xpReward: 1000, coinReward: 500, condition: { type: 'watch_count', value: 100 } },
    { name: 'Kinoshun', description: '500 ta film tomosha qiling', icon: '👑', tier: 'gold', xpReward: 5000, coinReward: 2500, condition: { type: 'watch_count', value: 500 } },
    { name: 'Kinoguru', description: '1000 ta film tomosha qiling', icon: '🏆', tier: 'platinum', xpReward: 10000, coinReward: 5000, condition: { type: 'watch_count', value: 1000 } },
    { name: 'Izohchi', description: '10 ta izoh yozing', icon: '💬', tier: 'bronze', xpReward: 300, coinReward: 150, condition: { type: 'reviews_count', value: 10 } },
    { name: 'Kollektsioner', description: '5 ta kolleksiya yarating', icon: '📦', tier: 'silver', xpReward: 500, coinReward: 250, condition: { type: 'collections_count', value: 5 } },
    { name: 'Tavsiyachi', description: '5 ta do\'st taklif qiling', icon: '👥', tier: 'silver', xpReward: 1000, coinReward: 500, condition: { type: 'referral_count', value: 5 } },
    { name: 'Daraja 10', description: '10-darajaga yeting', icon: '📈', tier: 'gold', xpReward: 2000, coinReward: 1000, condition: { type: 'level', value: 10 } },
    { name: 'Daraja 50', description: '50-darajaga yeting', icon: '🚀', tier: 'platinum', xpReward: 10000, coinReward: 5000, condition: { type: 'level', value: 50 } },
    { name: 'Streak ustasi', description: '30 kunlik streak', icon: '🔥', tier: 'gold', xpReward: 3000, coinReward: 1500, condition: { type: 'streak', value: 30 } },
    { name: 'Premium a\'zo', description: 'Premium a\'zo bo\'ling', icon: '💎', tier: 'platinum', xpReward: 5000, coinReward: 2500, condition: { type: 'premium', value: 1 } },
  ];

  for (const ach of achievements) {
    const existing = await prisma.achievement.findFirst({ where: { name: ach.name } });
    if (!existing) {
      await prisma.achievement.create({ data: ach });
    }
  }
  console.log('✅ Achievements created');

  // Scheduled tasks
  const tasks = [
    { name: 'Daily Backup', type: 'backup', schedule: '0 3 * * *' },
    { name: 'Cleanup Expired Sessions', type: 'cleanup', schedule: '0 4 * * *' },
    { name: 'Refresh Recommendations', type: 'recommendation_refresh', schedule: '0 2 * * *' },
    { name: 'Sync TMDB Metadata', type: 'metadata_sync', schedule: '0 5 * * 0' },
    { name: 'Update Daily Stats', type: 'stats_update', schedule: '0 1 * * *' },
  ];

  for (const task of tasks) {
    const existing = await prisma.scheduledTask.findFirst({ where: { name: task.name } });
    if (!existing) {
      await prisma.scheduledTask.create({ data: task });
    }
  }
  console.log('✅ Scheduled tasks created');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
