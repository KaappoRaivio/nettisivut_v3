const NodeCache = require("node-cache");
const path = require("path");
const fsp = require("fs/promises");
const fs = require("fs");
const glob = require("glob-promise");

const cache = new NodeCache();
const Handlebars = require("handlebars");
const express = require("express");

module.exports = async (app, config, GLOBAL_DATA) => {
  const postsRoot = path.join(config.blog.repositoryPath, "posts");

  const postFolders = await glob(path.join(postsRoot, "*"));
  console.log(postFolders);

  postFolders.forEach(postFolder => {
    const id = postFolder
      .split("/")
      .slice(postFolder.split("/").length - 1)
      .join("/");

    app.use(`/blog/static/${id}`, express.static(postFolder));
  });

  const blogpostTemplate = Handlebars.compile("{{> blogpost this}}");

  app.get("/blog/post/:id/:title", async (req, res, err) => {
    const { id, title } = req.params;

    let postContent;
    if (config.debug && cache.get(id)) {
      postContent = cache.get(id);
    } else {
      const postContentPath = path.join(postsRoot, id, "index.md");
      if (fs.existsSync(postContentPath)) {
        postContent = await fsp.readFile(postContentPath, "utf-8");
      } else {
        res.sendStatus(404);
        return;
      }
      cache.set(id, postContent);
    }

    const data = { ALL: GLOBAL_DATA, content: postContent };
    res.status(200).send(blogpostTemplate(data));
  });
  app.get("/blog/post/:id/res/:filePath", async (req, res, err) => {
    const { id, title, filePath } = req.params;

    const safeFilePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const safePath = path.join(postsRoot, id, "res", safeFilePath);

    res.sendFile(safePath);
  });

  return app;
};
