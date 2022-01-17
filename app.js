const express = require("express");
const yaml = require("yaml");
const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");
const glob = require("glob-promise");
const compression = require("compression");
const helmet = require("helmet");
const hljs = require("highlightjs");

const db = require("./config/db.js");
const config = require("./config/config.js");
const myLogger = require("./mylogger");
const redirectToHttps = require("./redirectToHttps");
const routes = require("./routes");

const { Remarkable } = require("remarkable");
const md = new Remarkable("full", {
  html: true,
  xhtmlOut: false,
  breaks: false,
  langPrefix: "language-",
  linkify: true,
  linkTarget: "",

  typographer: true,

  quotes: "“”‘’",
  highlight: function (str, lang) {
    console.log(lang);
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (__) {}

    return ""; // use external default escaping
  },
});

const prepareHandlebars = async () => {
  const templateFilePaths = await glob("templates/fragments/**/*.template.html");
  console.log("Defining the following templates:");

  console.group();
  templateFilePaths.forEach(path => console.log(path));
  console.groupEnd();

  templateFilePaths.forEach(templateFilePath => {
    const partialName = path.parse(templateFilePath).name.split(".")[0];
    Handlebars.registerPartial(partialName, fs.readFileSync(templateFilePath, "utf-8"));
  });

  Handlebars.registerHelper("reverseArray", array => array.slice().reverse());
  Handlebars.registerHelper("equals", (arg1, arg2) => {
    return arg1 === arg2;
  });
  Handlebars.registerHelper("log", (...args) => {
    if (!debug) console.log(...args);
  });
  Handlebars.registerHelper("markdown", options => {
    return md.render(options.fn());
  });
  Handlebars.registerHelper("include", includePath => {
    console.log(includePath);
    return fs.readFileSync(path.join(__dirname, includePath), "utf-8");
  });
};

const GLOBAL_DATA = db.getGlobalData();

module.exports = async () => {
  console.log("Debug: ", config.debug);
  await prepareHandlebars();

  const app = express();
  if (!config.debug) {
    app.use(helmet());
  }
  myLogger(app);
  redirectToHttps(app);
  app.use(compression());

  await routes(app);

  return app;
};
