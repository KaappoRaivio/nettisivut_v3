#!/usr/bin/env node

const https = require("https");
const http = require("http");
const fs = require("fs");

const redirectToHttps = require("./redirectToHttps");

const getCertificates = debug => {
  if (debug) return;
  const key = fs.readFileSync("/etc/letsencrypt/live/kaapporaivio.fi/privkey.pem", "utf8");
  const cert = fs.readFileSync("/etc/letsencrypt/live/kaapporaivio.fi/cert.pem", "utf8");
  const ca = fs.readFileSync("/etc/letsencrypt/live/kaapporaivio.fi/chain.pem", "utf8");
  return { key, cert, ca };
};

const makeApp = require("./app");

const main = async () => {
  const DEBUG = process.env.NODE_ENV !== "production";

  const app = await makeApp(DEBUG);

  if (DEBUG) {
    const httpServer = http.createServer(app);
    httpServer.listen(process.env.PORT || 3000);
  } else {
    const httpServer = http.createServer(redirectToHttps());
    httpServer.listen(80);
    const httpsServer = https.createServer(getCertificates(DEBUG), app);
    httpsServer.listen(process.env.PORT || 443, () => {
      console.log(`listening on HTTPS!`);
    });
  }
};

main().catch(err => console.error(err));
