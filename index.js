#!/usr/bin/env node

const https = require("https");
const http = require("http");
const fs = require("fs");

const redirectToHttps = require("./redirectToHttps");

const getCertificates = config => {
  if (config.debug) return;
  const key = fs.readFileSync(config.SSL.privateKey, "utf8");
  const cert = fs.readFileSync(config.SSL.certificate, "utf8");
  const ca = fs.readFileSync(config.SSL.chain, "utf8");
  return { key, cert, ca };
};

const makeApp = require("./app");

const main = async () => {
  const config = require("./config");
  const DEBUG = config.debug;

  const app = await makeApp(config);

  if (DEBUG) {
    const httpServer = http.createServer(app);
    httpServer.listen(config.port.debug);
  } else {
    const httpServer = http.createServer(redirectToHttps());
    httpServer.listen(80);
    const httpsServer = https.createServer(getCertificates(config), app);
    httpsServer.listen(config.port.production, () => {
      console.log(`Started server!`);
    });
  }
};

main().catch(err => console.error(err));
