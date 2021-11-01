const express = require("express");
const yaml = require("yaml");
const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");
const glob = require("glob-promise");


const app = express();
const IS_PRODUCTION = app.settings.env === "production";

const schema = yaml.parse(fs.readFileSync("public/res/schema.yaml", "utf-8"));
// console.log(schema);


const registerPartials = async () => {
    const templateFilePaths = await glob("templates/**/*.template.html");
    console.log(templateFilePaths);

    templateFilePaths.forEach(templateFilePath => {
        const partialName = path.parse(templateFilePath).name.split(".")[0];
        console.log(partialName)
        Handlebars.registerPartial(partialName, fs.readFileSync(templateFilePath, "utf-8"));
    })
}

const registerPages = async (app, schema) => {
    const pageFilePaths = await glob("templates/pages/**/*.template.html");
    console.log(pageFilePaths);

    pageFilePaths.forEach(pageFilePath => {
        const pageTemplate = Handlebars.compile(fs.readFileSync(pageFilePath, "utf-8"));
        const pageName = path.parse(pageFilePath).name.split(".")[0];

        app.get(`/${pageName}`, (req, res) => {
            res.status(200);
            res.send(pageTemplate(schema));
        })
    })
}


registerPartials().then(async () => {
    app.use('/public', express.static(path.join(__dirname, "/public")));
    await registerPages(app, schema);

    const mainTemplate = Handlebars.compile(fs.readFileSync("templates/pages/landing.template.html", "utf-8"));
    app.get("/", (req, res) => {
            res.status(200);
            res.send(mainTemplate(schema));
    })

    app.listen(8000, () => {
        console.log("listening on port 8000!")
    })
});
