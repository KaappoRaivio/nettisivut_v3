const db = require("./config/db");
const Handlebars = require("handlebars");
const fs = require("fs");
const express = require("express");
const path = require("path");
const yaml = require("yaml");
const fsp = require("fs/promises");
const getSlug = require("speakingurl");
const config = require("./config/config");

const GLOBAL_DATA = db.getGlobalData();

module.exports = async app => {
  app.use("/public", express.static(path.join(__dirname, "/public")));
  app.use("/.well-known", express.static(path.join(__dirname, "/.well-known")));
  // app.use("/sitemap.xml", express.static(path.join(__dirname, "/sitemap.xml")));
  app.use("/robots.txt", express.static(path.join(__dirname, "/robots.txt")));
  app.get("/sitemap.xml", (req, res) => {
    res.sendFile(express.static(path.join(__dirname, "/sitemap.xml")));
  });

  const boilerplateTemplate = await db.getBoilerplateTemplate();

  const pages = await db.getStaticPages();
  pages.forEach(({ pageName, pageTemplate, pageData }) => {
    console.log(pageName);
    app.get(`/${pageName}`, async (req, res) => {
      res.status(200).send(boilerplateTemplate({ ALL: await db.getGlobalData(), content: pageTemplate(pageData) }));
    });
  });

  app.get("/", (req, res) => {
    res.status(200).send(db.getLandingPage());
  });

  const blogIndexTemplate = Handlebars.compile("{{> blogIndex this}}");
  app.get("/blog", async (req, res, err) => {
    const data = await db.getBlogPosts();
    // console.log(data);

    res.status(200).send(blogIndexTemplate(data));
  });

  app.get("/blog/post/:id/res/:filePath", async (req, res, err) => {
    const { id, filePath } = req.params;

    try {
      res.send(await db.getBlogAsset(id, filePath));
      res.status(200);
    } catch (e) {
      res.sendStatus(404);
    }
  });

  app.get("/blog/post/:id", async (req, res, err) => {
    const { id } = req.params;

    let postIndex = id - 1;
    if (postIndex === -1) res.sendStatus(404);

    try {
      const { postContent, meta } = await db.getBlogPost(id);
      res.redirect(301, path.join("/blog/post", id, meta.slug));
    } catch (e) {
      res.sendStatus(404);
    }
  });

  app.get("/blog/post/:id/:title/:action", (req, res, err) => {
    const { action, id } = req.params;
    console.log(action);
    if (action === "nextPost") {
      res.redirect(301, `/blog/post/${parseInt(id) + 1}`);
    } else if (action === "previousPost") {
      res.redirect(301, `/blog/post/${parseInt(id) - 1}`);
    }
  });

  const blogpostTemplate = Handlebars.compile("{{> blogpost this}}");
  app.get("/blog/post/:id/:title", async (req, res, err) => {
    const { id, title } = req.params;

    const { templateData, meta } = await db.getBlogPost(id);
    res.status(200).send(blogpostTemplate({ ...templateData, meta }));
  });

  const HTTP404Template = Handlebars.compile("{{> notFound }}");
  app.use(async (req, res, next) => {
    res.status(404).send(HTTP404Template({ ALL: await db.getGlobalData() }));
  });
};
