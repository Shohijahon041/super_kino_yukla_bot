const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve('C:/Users/User/kino-bot/kino.db'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  console.log(`\n${t.name} (${cols.length} columns):`);
  cols.forEach(c => console.log(`  ${c.name} (${c.type})`));
  
  const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get();
  console.log(`  -> ${count.cnt} rows`);
});

db.close();
