//TODO Use a real database. For the time being, just juggle files.

const yaml = require("yaml");
const fs = require("fs");

const config = require("./config.js");
const globp = require("glob-promise");
const glob = require("glob");
const Handlebars = require("handlebars");
const path = require("path");
const fsp = require("fs/promises");
const getSlug = require("slug");

const GLOBAL_DATA = yaml.parse(fs.readFileSync("public/data/ALL.data.yaml", "utf-8"));
GLOBAL_DATA.debug = config.debug;

const sanitizePath = filePath => {
  return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
};

const postsRoot = path.join(config.blog.repositoryPath, "posts");
const postFolders = glob.sync(path.join(postsRoot, "*"));
console.log(postFolders);

module.exports = {
  getGlobalData: () => {
    return GLOBAL_DATA;
  },
  getStaticPages: async () => {
    const pageFilePaths = await globp("views/**/*.template.html");
    // console.log("Defining the following pages:");
    // console.group();
    // pageFilePaths.forEach(path => console.log(path));
    // console.groupEnd();

    return pageFilePaths.map(pageFilePath => {
      const pageTemplate = Handlebars.compile(fs.readFileSync(pageFilePath, "utf-8"));
      const pageDataPath = ["public/data", ...pageFilePath.split("/").slice(1)].join("/").replace(".template.html", ".data.yaml");
      let pageData = {};
      if (fs.existsSync(pageDataPath)) {
        try {
          pageData = yaml.parse(fs.readFileSync(pageDataPath, "utf-8"));
        } catch (e) {
          console.error(e);
        }
      }
      const pageName = pageFilePath.split("/").slice(1).join("/").replace(".template.html", "");

      return { pageTemplate, pageData: { ...pageData, ALL: GLOBAL_DATA }, pageName };
    });
  },
  getBoilerplateTemplate: async () => {
    return Handlebars.compile(await fsp.readFile("views/BOILERPLATE.template.html", "utf-8"));
  },
  getLandingPage: () => {
    const mainTemplate = Handlebars.compile(fs.readFileSync("views/landing.template.html", "utf-8"));
    return mainTemplate({ ALL: GLOBAL_DATA });
  },

  getBlogPosts: async () => {
    return {
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
            cleanTitle: getSlug(title),
          };
        })
      ),
    };
  },

  getBlogAsset: async (id, localFilePath) => {
    const sanitizedLocalPath = sanitizePath(localFilePath);
    const safePath = path.join(postsRoot, id, "res", sanitizedLocalPath);
    if (fs.existsSync(safePath)) {
      return await fsp.readFile(safePath);
    } else {
      return Promise.reject("Not found");
    }
  },

  getBlogPost: async id => {
    const postContentPath = path.join(postsRoot, id, "index.md");
    const postYamlPath = path.join(postsRoot, id, "post.yaml");

    if (fs.existsSync(postContentPath) && fs.existsSync(postYamlPath)) {
      const postContent = await fsp.readFile(postContentPath, "utf-8");
      const meta = yaml.parse(await fsp.readFile(postYamlPath, "utf-8"));
      meta.slug = getSlug(meta.title);

      const templateData = {
        ALL: GLOBAL_DATA,
        content: postContent,
        isFirst: parseInt(id) === 1,
        isLast: parseInt(id) === postFolders.length,
        currentPostId: id,
        amountOfPosts: postFolders.length,
        coverImageSrc: meta?.coverImage?.src,
      };

      return { postContent, meta, templateData };
    } else {
      return Promise.reject("Not found");
    }
  },
};
