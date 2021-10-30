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

    // Handlebars.registerPartial("head", fs.readFileSync("templates/head.template.html", "utf-8"))
    // Handlebars.registerPartial("header", fs.readFileSync("templates/header.template.html", "utf-8"))
    // Handlebars.registerPartial("fancyGreeting", fs.readFileSync("templates/fancyGreeting.template.html", "utf-8"))
}




registerPartials().then(() => {
    // if (!IS_PRODUCTION) {
    const mainTemplate = Handlebars.compile(fs.readFileSync("templates/index.template.html", "utf-8"));
    // }
    app.get("/", (req, res) => {
        if (!IS_PRODUCTION) {
            Handlebars.c
            const mainTemplate = Handlebars.compile(fs.readFileSync("templates/index.template.html", "utf-8"));
            res.status(200);
            res.send(mainTemplate(schema));
        }

        res.status(200);
        res.send(mainTemplate(schema));
        // console.log(mainTemplate(schema))
        // res.html(mainTemplate(schema));
    })

    app.use('/public', express.static(path.join(__dirname, "/public")))
    app.listen(8000, () => {
        console.log("listening on port 8000!")
    })
});
