const NodeCache = require("node-cache");
const path = require("path");
const fsp = require("fs/promises");
const fs = require("fs");
const glob = require("glob-promise");
const yaml = require("yaml");

const cache = new NodeCache();
const Handlebars = require("handlebars");
const express = require("express");
const getSlug = require("speakingurl");

const sanitizePath = filePath => {
  return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
};

module.exports = async (app, config, GLOBAL_DATA) => {
  const postsRoot = path.join(config.blog.repositoryPath, "posts");

  const postFolders = await glob(path.join(postsRoot, "*"));
  // console.log(postFolders);

  // postFolders.forEach(postFolder => {
  //   const id = postFolder
  //     .split("/")
  //     .slice(postFolder.split("/").length - 1)
  //     .join("/");
  //
  //   app.use(`/blog/static/${id}`, express.static(postFolder));
  // });

  const blogpostTemplate = Handlebars.compile("{{> blogpost this}}");

  app.get("/blog/post/:id", async (req, res, err) => {
    const { id } = req.params;
    console.log("asd", id);

    let postIndex = id - 1;
    if (postIndex === -1) res.sendStatus(404);

    const postConfig = yaml.parse(await fsp.readFile(path.join(postFolders[postIndex], "post.yaml"), "utf-8"));
    res.redirect(301, path.join("/blog/post", id, getSlug(postConfig.title)));
  });

  app.get("/blog/post/:id/:title", async (req, res, err) => {
    const { action } = req.query;
    const { id, title } = req.params;
    if (action === "nextPost") {
      console.log("moi");
      res.redirect(301, `/blog/post/${parseInt(id) + 1}`);
      return;
    } else if (action === "previousPost") {
      res.redirect(301, `/blog/post/${parseInt(id) - 1}`);
      return;
    }

    let postContent;
    if (config.debug && cache.get(id)) {
      postContent = cache.get(id);
    } else {
      const postContentPath = path.join(postsRoot, id, "index.md");
      if (fs.existsSync(postContentPath)) {
        postContent = await fsp.readFile(postContentPath, "utf-8");
      } else {
        console.log("asdasd");
        res.sendStatus(404);
        return;
      }
      cache.set(id, postContent);
    }

    const data = {
      ALL: GLOBAL_DATA,
      content: postContent,
      isFirst: parseInt(id) === 1,
      isLast: parseInt(id) === postFolders.length,
      currentPostId: id,
      amountOfPosts: postFolders.length,
    };
    res.status(200).send(blogpostTemplate(data));
  });

  app.get("/blog/post/:id/res/:filePath", async (req, res, err) => {
    const { id, title, filePath } = req.params;

    const safeFilePath = sanitizePath(filePath);
    const safePath = path.join(postsRoot, id, "res", safeFilePath);
    console.log(safePath, "moi");

    if (fs.existsSync(safePath)) {
      res.sendFile(safePath);
    } else {
      console.log("moioiioio");
      if (config.debug) res.sendStatus(404);
      // next();
    }
  });

  // app.get("/blog/*", (req, res, err) => {
  //   res.redirect("/blog");
  // });

  const blogIndexTemplate = Handlebars.compile("{{> blogIndex this}}");
  app.get("/blog", async (req, res, err) => {
    let data;
    if (!config.debug && cache.has("blogData")) {
      data = cache.get("blogData");
    } else {
      data = {
        ALL: GLOBAL_DATA,
        posts: await Promise.all(
          postFolders.map(async postFolder => {
            const { previewText, title, coverImage } = yaml.parse(await fsp.readFile(path.join(postFolder, "post.yaml"), "utf-8"));
            const id = postFolder
              .split("/")
              .slice(postFolder.split("/").length - 1)
              .join("/");

            return {
              title,
              previewText,
              coverImage: {
                ...coverImage,
                src: path.join("/blog/post/", id, coverImage.src),
              },
              id,
            };
          })
        ),
      };
      cache.set("blogData", data, 600);
    }

    res.status(200).send(blogIndexTemplate(data));
  });

  return app;
};
