#!/usr/bin/env node

const https = require("https");
const http = require("http");
const fs = require("fs");
const { getCertificates } = require("./config/credentials");

const redirectToHttps = require("./redirectToHttps");

const makeApp = require("./app");
const express = require("express");

const config = require("./config/config");
const main = async () => {
  const DEBUG = config.debug;

  const app = await makeApp(config);
  app.use("/api/v1", require("./backend/app")(config));

  if (DEBUG) {
    const httpServer = http.createServer(app);
    httpServer.listen(config.port.debug);
  } else {
    const redirector = express();
    redirectToHttps(redirector);
    const httpServer = http.createServer(redirector);
    httpServer.listen(80);
    const httpsServer = https.createServer(getCertificates(config), app);
    httpsServer.listen(config.port.production, () => {
      console.log(`Started server!`);
    });
  }
};

main().catch(err => console.error(err));
module.exports = makeApp(config);
