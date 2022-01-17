#!/usr/bin/env node

const https = require("https");
const http = require("http");
const fs = require("fs");
const { getCertificates } = require("./config/credentials");

const redirectToHttps = require("./redirectToHttps");

const makeApp = require("./app");
const express = require("express");

const main = async () => {
  const config = require("./config/config");
  const DEBUG = config.debug;

  const app = await makeApp(config);

  if (DEBUG) {
    const httpServer = http.createServer(app);
    httpServer.listen(config.port.debug);
  } else {
    const app = express();
    redirectToHttps(app);
    const httpServer = http.createServer(app);
    httpServer.listen(80);
    const httpsServer = https.createServer(getCertificates(config), app);
    httpsServer.listen(config.port.production, () => {
      console.log(`Started server!`);
    });
  }
};

main().catch(err => console.error(err));
