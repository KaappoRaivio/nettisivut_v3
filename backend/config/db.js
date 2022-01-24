const Database = require("sqlite-async");

const seedData = async db => {
  await db.run("DROP TABLE IF EXISTS authors");
  await db.run("DROP TABLE IF EXISTS blogposts");

  await db.run("CREATE TABLE IF NOT EXISTS authors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL)");
  await db.run("INSERT INTO authors (name, email) VALUES (?, ?)", "Kaappo Raivio", "kaappo.raivio@gmail.com");
  await db.run("INSERT INTO authors (name, email) VALUES (?, ?)", "Admin", "admin@kaapporaivio.fi");

  await db.run(
    "CREATE TABLE IF NOT EXISTS blogposts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL, content TEXT NOT NULL, author INTEGER NOT NULL, FOREIGN  KEY (author) REFERENCES authors (id) ON DELETE CASCADE)"
  );
  await db.run(
    "INSERT INTO blogposts (title, slug, content, author) VALUES (?, ?, ?, ?)",
    "Test title",
    "test-title",
    "# content\nwhitespace **bold**",
    "1"
  );

  await db.run(
    "INSERT INTO blogposts (title, slug, content, author) VALUES (?, ?, ?, ?)",
    "Test title 2",
    "test-title-2",
    "# content2\nwhitespace **bold**",
    "1"
  );
};

const getDatabase = async config => {
  const db = await Database.open(config.backend.databaseFilepath);
  await db.run("PRAGMA foreign_keys = ON");

  if (config.debug) {
    await seedData(db);
  }

  return db;
};

module.exports = config => getDatabase(config);
