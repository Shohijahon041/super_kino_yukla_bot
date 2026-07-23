const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve('C:/Users/User/kino-bot/kino.db'));

const movies = db.prepare('SELECT code, message_id, chat_id, file_id, is_document FROM movies LIMIT 5').all();
console.log('Sample movies:');
movies.forEach(m => {
  console.log(`  code=${m.code}, message_id=${m.message_id}, chat_id=${m.chat_id}, is_document=${m.is_document}, file_id=${m.file_id?.substring(0, 30)}...`);
});

db.close();
