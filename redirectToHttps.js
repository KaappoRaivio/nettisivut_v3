module.exports = (app, useHTTPS) => {
  if (useHTTPS)
    app.use((req, res, next) => {
      if (process.env.NODE_ENV === "production") {
        if (!req.connection.encrypted) return res.redirect("https://" + req.headers.host + req.url);
        else return next();
      } else return next();
    });
  else {
    console.log("Not redirecting to https!");
  }
};
