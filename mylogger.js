const morgan = require("morgan");
const express = require("express");
const fs = require("fs");
const errorHandler = require("errorhandler");
const config = require("./config/config.js");

module.exports = app => {
  if (config.debug) {
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
  } else {
    app.use(errorHandler());
  }

  app.use(
    morgan(":date[iso] :method :url :status :res[content-length] - :response-time ms", {
      stream: fs.createWriteStream("./log.log", { flags: "a" }),
    })
  );

  if (config.debug) app.use(morgan(":date[iso] :method :url :status :res[content-length] - :response-time ms"));
};
