const path = require("path");
const fs = require("fs");
const Database = require("sqlite-async");
const glob = require("glob");
const getSlug = require("slug");
const yaml = require("yaml");
// const config = require("./config.js");

const seedData = async db => {
  await db.run("DROP TABLE IF EXISTS authors");
  await db.run("DROP TABLE IF EXISTS blogposts");

  await db.run("CREATE TABLE IF NOT EXISTS authors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL)");
  await db.run("INSERT INTO authors (name, email) VALUES (?, ?)", "Kaappo Raivio", "kaappo.raivio@gmail.com");
  await db.run("INSERT INTO authors (name, email) VALUES (?, ?)", "Admin", "admin@kaapporaivio.fi");

  await db.run(
    "CREATE TABLE IF NOT EXISTS blogposts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL, previewText TEXT NOT NULL, content TEXT NOT NULL, author INTEGER NOT NULL, FOREIGN  KEY (author) REFERENCES authors (id) ON DELETE CASCADE)"
  );
  // await db.run(
  //   "INSERT INTO blogposts (title, slug, content, author) VALUES (?, ?, ?, ?)",
  //   "Test title",
  //   "test-title",
  //   "# content\nwhitespace **bold**",
  //   "1"
  // );
  //
  // await db.run(
  //   "INSERT INTO blogposts (title, slug, content, author) VALUES (?, ?, ?, ?)",
  //   "Test title 2",
  //   "test-title-2",
  //   "# content2\nwhitespace **bold**",
  //   "1"
  // );
};

const syncDatabase = async (db, config) => {
  const postsRoot = path.join(config.blog.repositoryPath, "posts");
  const postFolders = glob.sync(path.join(postsRoot, "*"));

  console.log("Syncing database!");
  console.group();

  const posts = await Promise.all(
    postFolders.map(async postFolder => {
      console.log(postFolder);
      console.group();
      const { previewText, title, coverImage } = yaml.parse(fs.readFileSync(path.join(postFolder, "post.yaml"), "utf-8"));
      const id = postFolder
        .split("/")
        .slice(postFolder.split("/").length - 1)
        .join("/");

      const postContent = fs.readFileSync(path.join(postFolder, "index.md"), "utf8");

      console.log(postContent);
      await db.run(
        "INSERT INTO blogposts (title, slug, previewText, content, author) VALUES (?, ?, ?, ?, ?)",
        title,
        getSlug(title),
        previewText,
        postContent,
        "1"
      );
      console.groupEnd();

      // return {
      //   title,
      //   previewText,
      //   coverImage: {
      //     ...coverImage,
      //     src: path.join("/blog/post/", id, coverImage.src),
      //   },
      //   id,
      //   cleanTitle: getSlug(title),
      // };
    })
  );
  console.groupEnd();
};

const getDatabase = async config => {
  if (!fs.existsSync(config.backend.databaseFolder)) {
    fs.mkdirSync(config.backend.databaseFolder, { recursive: true });
  }
  const db = await Database.open(path.join(config.backend.databaseFolder, config.backend.databaseFilename));
  await db.run("PRAGMA foreign_keys = ON");

  if (config.debug) {
    await seedData(db);
  }
  await syncDatabase(db, config);

  return db;
};

module.exports = config => getDatabase(config);
