const express = require("express");
const yaml = require("yaml");
const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");
const glob = require("glob-promise");
const compression = require("compression");

module.exports = async debug => {
  const app = express();
  app.use(compression());

  require("./mylogger")(app, debug);

  const GLOBAL_DATA = yaml.parse(fs.readFileSync("public/data/about.data.yaml", "utf-8"));
  GLOBAL_DATA.debug = debug;
  console.log("Debug: ", debug);

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
      console.log(...args);
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

  require("./redirectToHttps")(app, debug);

  await registerPartials();

  app.use("/public", express.static(path.join(__dirname, "/public")));
  app.use("/.well-known", express.static(path.join(__dirname, "/.well-known")));
  await registerPages(app, GLOBAL_DATA);

  const mainTemplate = Handlebars.compile(fs.readFileSync("templates/pages/landing.template.html", "utf-8"));
  app.get("/", (req, res) => {
    res.status(200);
    res.send(mainTemplate({ ALL: GLOBAL_DATA }));
  });

  return app;
};
