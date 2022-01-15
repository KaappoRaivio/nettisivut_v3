const morgan = require("morgan");
const express = require("express");
const fs = require("fs");
const errorHandler = require("errorhandler");

module.exports = (app, config) => {
  if (process.env.NODE_ENV === "development") {
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
  }

  if (process.env.NODE_ENV === "production") {
    app.use(errorHandler());
  }

  app.use(
    morgan(":date[iso] :method :url :status :res[content-length] - :response-time ms", {
      stream: fs.createWriteStream("./log.log", { flags: "a" }),
    })
  );

  if (config.debug) app.use(morgan(":date[iso] :method :url :status :res[content-length] - :response-time ms"));
};
