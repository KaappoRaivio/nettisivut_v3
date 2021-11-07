const express = require("express");

module.exports = () => {
  const app = express();

  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      if (!req.connection.encrypted) return res.redirect("https://" + req.headers.host + req.url);
      else return next();
    } else return next();
  });

  app.use((req, res, next) => {
    if (req.headers.host.slice(0, 4) === "www.") {
      var newHost = req.headers.host.slice(4);
      return res.redirect(301, `https://${newHost}${req.originalUrl}`);
    }
    next();
  });

  return app;
};
