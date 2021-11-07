const https = require("https");
const http = require("http");
const fs = require("fs");

const makeApp = require("./app");

const main = async () => {
  const useHTTPS = false;
  const app = await makeApp(useHTTPS);

  const httpsServer = https.createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },
    app
  );
  const httpServer = http.createServer(app);

  let port = process.env.PORT || useHTTPS ? 443 : 80;
  httpServer.listen(process.env.PORT || 80);
  httpsServer.listen(process.env.PORT || 443, () => {
    console.log(`listening on port ${port}!`);
  });
};

main().catch(err => console.error(err));
