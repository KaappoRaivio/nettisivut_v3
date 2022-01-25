const path = require("path");
const debug = process.env.NODE_ENV !== "production";
module.exports = {
  debug,
  port: {
    debug: process.env.PORT || 3001,
    production: 443,
  },
  SSL: {
    privateKey: "/etc/letsencrypt/live/kaapporaivio.fi/privkey.pem",
    certificate: "/etc/letsencrypt/live/kaapporaivio.fi/cert.pem",
    chain: "/etc/letsencrypt/live/kaapporaivio.fi/chain.pem",
  },
  blog: {
    repositoryPath: process.env.X_BLOG_REPOSITORY_PATH || path.join(__dirname, "blogcontent"),
  },
  backend: {
    databaseFilename: "db.db",
    databaseFolder: process.env.X_DATABASE_FOLDER || "/home/kaappo/Desktop/nettisivudatabase",
  },
};
