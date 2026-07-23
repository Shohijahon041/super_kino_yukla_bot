const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

const prisma = new PrismaClient();
const sqliteDb = new Database(path.resolve('C:/Users/User/kino-bot/kino.db'));

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 150);
}

function parseYear(yearStr) {
  if (!yearStr) return null;
  const match = yearStr.match(/(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

function parseDuration(durStr) {
  if (!durStr) return null;
  const match = durStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

const GENRE_MAP = {
  'жанр': null,
  'боевик': 'jangari',
  'боевики': 'jangari',
  'комедия': 'komediya',
  'комедии': 'komediya',
  'драма': 'drama',
  'драмы': 'drama',
  'фильмы': null,
  'фильм': null,
  'триллер': 'triller',
  'триллеры': 'triller',
  'ужасы': 'xorror',
  'фэнтези': 'fantastika',
  'фантастика': 'fantастика',
  'мелодрама': 'romantik',
  'приключения': 'sarguzasht',
  'семейный': 'oilaviy',
  'исторический': 'tarixiy',
  'военный': 'harbiy',
  'криминал': 'jinoyat',
  'мультфильм': 'multfilm',
  'мультфильмы': 'multfilm',
  'аниме': 'anime',
  'документальный': 'hujjatli',
  'спорт': 'sport',
  'мюзикл': 'musiqa',
  'супергерой': 'superqahramon',
};

const COUNTRY_MAP = {
  'usa': 'AQSH',
  'us': 'AQSH',
  'америка': 'AQSH',
  'америка': 'AQSH',
  'россия': 'Rossiya',
  'ru': 'Rossiya',
  'korea': 'Janubiy Koreya',
  'корея': 'Janubiy Koreya',
  'япония': 'Yaponiya',
  'jp': 'Yaponiya',
  'turkey': 'Turkiya',
  'turkiye': 'Turkiya',
  'турция': 'Turkiya',
  'turk': 'Turkiya',
  'turkcha': 'Turkiya',
  'hindiston': 'Hindiston',
  'индия': 'Hindiston',
  'in': 'Hindiston',
  'хитой': 'Xitoy',
  'китай': 'Xitoy',
  'gb': 'Buyuk Britaniya',
  'british': 'Buyuk Britaniya',
  'британия': 'Buyuk Britaniya',
  'germany': 'Germaniya',
  'germaniya': 'Germaniya',
  'германия': 'Germaniya',
  'france': 'Fransiya',
  'франция': 'Fransiya',
  'italy': 'Italiya',
  'италия': 'Italiya',
  'spain': 'Ispaniya',
  'испания': 'Ispaniya',
  'canada': 'Kanada',
  'канада': 'Kanada',
  'australia': 'Avstraliya',
  'австралия': 'Avstraliya',
};

async function main() {
  console.log('🎬 Starting movie import from SQLite to PostgreSQL...\n');

  const movies = sqliteDb.prepare('SELECT * FROM movies ORDER BY code').all();
  console.log(`Found ${movies.length} movies in SQLite\n`);

  const genreCache = {};
  const countryCache = {};
  const languageCache = {};

  const genres = await prisma.genre.findMany();
  genres.forEach(g => { genreCache[g.slug] = g.id; genreCache[g.name.toLowerCase()] = g.id; });

  const countries = await prisma.country.findMany();
  countries.forEach(c => {
    countryCache[c.code] = c.id;
    countryCache[c.name.toLowerCase()] = c.id;
  });

  const languages = await prisma.language.findMany();
  languages.forEach(l => {
    languageCache[l.code] = l.id;
    languageCache[l.name.toLowerCase()] = l.id;
  });

  const existingCodes = new Set(
    (await prisma.movie.findMany({ select: { code: true } })).map(m => m.code)
  );
  console.log(`Already ${existingCodes.size} movies in PostgreSQL\n`);

  const slugs = new Set(
    (await prisma.movie.findMany({ select: { slug: true } })).map(m => m.slug)
  );

  let imported = 0;
  let skipped = 0;
  const BATCH = 50;

  for (let i = 0; i < movies.length; i += BATCH) {
    const batch = movies.slice(i, i + BATCH);
    
    for (const m of batch) {
      if (existingCodes.has(m.code)) {
        skipped++;
        continue;
      }

      let slug = slugify(m.title || `movie-${m.code}`);
      if (!slug) slug = `movie-${m.code}`;
      let uniqueSlug = slug;
      let counter = 1;
      while (slugs.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter++}`;
      }
      slugs.add(uniqueSlug);

      const year = parseYear(m.year);
      const duration = parseDuration(m.duration);
      const isDocument = m.is_document === 1;

      try {
        const movie = await prisma.movie.create({
          data: {
            code: m.code,
            title: m.title || `Film ${m.code}`,
            originalTitle: m.original_caption || null,
            slug: uniqueSlug,
            description: m.description || null,
            year,
            duration,
            quality: m.quality || null,
            telegramFileId: m.file_id || null,
            fileSize: m.size ? BigInt(parseInt(m.size) || 0) : null,
            isActive: true,
          },
        });

        if (m.genre) {
          const genreNames = m.genre.split(',').map(g => g.trim().toLowerCase()).filter(Boolean);
          for (const gName of genreNames) {
            const genreSlug = GENRE_MAP[gName] || gName;
            const genreId = genreCache[genreSlug] || genreCache[gName];
            if (genreId) {
              await prisma.movieGenre.create({ data: { movieId: movie.id, genreId } }).catch(() => {});
            }
          }
        }

        if (m.country) {
          const countryNames = m.country.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
          for (const cName of countryNames) {
            const countryName = COUNTRY_MAP[cName] || cName;
            let countryId = countryCache[countryName] || countryCache[cName];
            if (!countryId) {
              const c = await prisma.country.findFirst({ where: { name: { contains: cName, mode: 'insensitive' } } });
              if (c) countryId = c.id;
            }
            if (countryId) {
              await prisma.movieCountry.create({ data: { movieId: movie.id, countryId } }).catch(() => {});
            }
          }
        }

        if (m.language) {
          const langNames = m.language.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
          for (const lName of langNames) {
            const langId = languageCache[lName] || languageCache[lName + 'cha'];
            if (langId) {
              await prisma.movieLanguage.create({ data: { movieId: movie.id, languageId: langId } }).catch(() => {});
            }
          }
        }

        imported++;
        if (imported % 100 === 0) {
          console.log(`  ✅ ${imported}/${movies.length} imported...`);
        }
      } catch (error) {
        skipped++;
        if (error.code !== 'P2002') {
          console.error(`  ❌ Code ${m.code}: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n🎉 Import completed!`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);

  await prisma.$disconnect();
  sqliteDb.close();
}

main().catch(console.error);
