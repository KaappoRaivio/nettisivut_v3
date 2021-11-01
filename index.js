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


// await registerPartials();

registerPartials().then(() => {
    app.use('/public', express.static(path.join(__dirname, "/public")))

    const mainTemplate = Handlebars.compile(fs.readFileSync("templates/index.template.html", "utf-8"));
    app.get("/", (req, res) => {
            res.status(200);
            res.send(mainTemplate(schema));
    })

    const aboutTemplate = Handlebars.compile(fs.readFileSync("templates/about.template.html", "utf-8"));
    app.get("/about", (req, res) => {
        res.status(200);
        res.send(aboutTemplate(schema));
    })

    const portfolioTemplate = Handlebars.compile(fs.readFileSync("templates/portfolio.template.html", "utf-8"));
    app.get("/portfolio", (req, res) => {
        res.status(200);
        res.send(portfolioTemplate(schema));
    })

    const cvTemplate = Handlebars.compile(fs.readFileSync("templates/cv.template.html", "utf-8"));
    app.get("/cv", (req, res) => {
        res.status(200);
        res.send(cvTemplate(schema));
    })

    app.listen(8000, () => {
        console.log("listening on port 8000!")
    })
});
