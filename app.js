const express = require("express");
const yaml = require("yaml");
const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");
const glob = require("glob-promise");
const compression = require("compression");
const helmet = require("helmet");
const hljs = require("highlightjs");

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

module.exports = async config => {
  const app = express();
  if (!config.debug) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'"],
          },
        },
      })
    );
  }
  app.use(compression());

  require("./mylogger")(app, config);

  const GLOBAL_DATA = yaml.parse(fs.readFileSync("public/data/about.data.yaml", "utf-8"));
  GLOBAL_DATA.debug = config.debug;
  console.log("Debug: ", config.debug);

  const registerPartials = async () => {
    const templateFilePaths = await glob("templates/**/*.template.html");
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
      // return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
      return arg1 === arg2;
    });
    Handlebars.registerHelper("log", (...args) => {
      if (!debug) console.log(...args);
    });
    Handlebars.registerHelper("markdown", options => {
      // console.log(options);
      // console.log(options.fn());
      // console.log(options.fn());
      // console.log(md.render(options.fn()));

      return md.render(options.fn());
    });
    Handlebars.registerHelper("include", includePath => {
      console.log(includePath);
      return fs.readFileSync(path.join(__dirname, includePath), "utf-8");
    });
  };

  const registerPages = async (app, ALL) => {
    const pageFilePaths = await glob("templates/pages/**/*.template.html");
    console.log("Defining the following pages:");
    console.group();
    pageFilePaths.forEach(path => console.log(path));
    console.groupEnd();

    pageFilePaths.forEach(pageFilePath => {
      const pageTemplate = Handlebars.compile(fs.readFileSync(pageFilePath, "utf-8"));
      const pageDataPath = ["public/data", ...pageFilePath.split("/").slice(2)].join("/").replace(".template.html", ".data.yaml");
      let pageData = {};
      if (fs.existsSync(pageDataPath)) {
        try {
          pageData = yaml.parse(fs.readFileSync(pageDataPath, "utf-8"));
        } catch (e) {
          console.error(e);
        }
      }

      const pageName = pageFilePath.split("/").slice(2).join("/").replace(".template.html", "");

      app.get(`/${pageName}`, (req, res) => {
        res.status(200);
        res.send(pageTemplate({ ALL, ...pageData }));
      });
    });
  };

  require("./redirectToHttps")(app, config);

  await registerPartials();

  app.use("/public", express.static(path.join(__dirname, "/public")));
  app.use("/.well-known", express.static(path.join(__dirname, "/.well-known")));
  await registerPages(app, GLOBAL_DATA);

  const mainTemplate = Handlebars.compile(fs.readFileSync("templates/pages/landing.template.html", "utf-8"));
  app.get("/", (req, res) => {
    res.status(200);
    res.send(mainTemplate({ ALL: GLOBAL_DATA }));
  });

  await require("./blog")(app, config, GLOBAL_DATA);

  return app;
};
