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

  const schema = yaml.parse(fs.readFileSync("public/res/schema.yaml", "utf-8"));
  schema.debug = DEBUG;
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
  };

  const registerPages = async (app, schema) => {
    const pageFilePaths = await glob("templates/pages/**/*.template.html");
    console.log("Defining the following pages:");
    console.group();
    pageFilePaths.forEach(path => console.log(path));
    console.groupEnd();

    pageFilePaths.forEach(pageFilePath => {
      const pageTemplate = Handlebars.compile(fs.readFileSync(pageFilePath, "utf-8"));
      const pageName = path.parse(pageFilePath).name.split(".")[0];

      app.get(`/${pageName}`, (req, res) => {
        res.status(200);
        res.send(pageTemplate(schema));
      });
    });
  };

  require("./redirectToHttps")(app, debug);

  await registerPartials();

  app.use("/public", express.static(path.join(__dirname, "/public")));
  app.use("/.well-known", express.static(path.join(__dirname, "/.well-known")));
  await registerPages(app, schema);

  const mainTemplate = Handlebars.compile(fs.readFileSync("templates/pages/landing.template.html", "utf-8"));
  app.get("/", (req, res) => {
    res.status(200);
    res.send(mainTemplate(schema));
  });

  return app;
};
