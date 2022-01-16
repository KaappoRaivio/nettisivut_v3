const NodeCache = require("node-cache");
const path = require("path");
const fsp = require("fs/promises");
const fs = require("fs");
const glob = require("glob-promise");
const yaml = require("yaml");

const cache = new NodeCache();
const Handlebars = require("handlebars");
const express = require("express");

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
        console.log("asdasd");
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
        // posts: [
        //   {
        //     title: "first",
        //     previewText:
        //       "Chicken tastes best with peppermint tea and lots of vegemite. Mix the okra with ripe cinnamon, pepper, chipotle chile powder, and corn syrup making sure to cover all of it. Everyone loves the consistency of chicken salad flavord with smashed dill.",
        //     coverImage: {
        //       src: "/public/res/header_background.webp",
        //     },
        //     id: 1,
        //   },
        //   {
        //     title: "second",
        //     previewText:
        //       "Aye, yer not enduring me without a yellow fever! Where is the lively mate? The parrot raids with madness, rob the freighter until it whines.Greed, power, and life.",
        //     coverImage: {
        //       src: "/public/res/1.webp",
        //     },
        //     id: 1,
        //   },
        // ],
      };
      cache.set("blogData", data, 600);
    }

    res.status(200).send(blogIndexTemplate(data));
  });

  return app;
};
