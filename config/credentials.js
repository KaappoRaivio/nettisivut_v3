import fs from "fs";

const config = require("./config");
const getCertificates = () => {
  if (config.debug) return;
  const key = fs.readFileSync(config.SSL.privateKey, "utf8");
  const cert = fs.readFileSync(config.SSL.certificate, "utf8");
  const ca = fs.readFileSync(config.SSL.chain, "utf8");
  return { key, cert, ca };
};
module.exports = { getCertificates };
