const express = require("express");

const config = require("./config/config.js");

module.exports = app => {
  app.use((req, res, next) => {
    if (!config.debug) {
      if (!req.connection.encrypted) return res.redirect("https://" + req.headers.host + req.url);
      else return next();
    } else return next();
  });

  app.use((req, res, next) => {
    if (req.headers.host.slice(0, 4) === "www.") {
      console.log("www!");
      const newHost = req.headers.host.slice(4);
      return res.redirect(301, `https://${newHost}${req.originalUrl}`);
    }
    next();
  });

  return app;
};
