const express = require("express");

module.exports = () => {
  const app = express();

  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      if (!req.connection.encrypted) return res.redirect("https://" + req.headers.host + req.url);
      else return next();
    } else return next();
  });

  return app;
};
