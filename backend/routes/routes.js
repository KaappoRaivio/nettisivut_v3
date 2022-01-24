const express = require("express");
const modelFactory = require("../models/model");

module.exports = config => {
  const router = express.Router();
  const model = modelFactory(config);

  router.get("/blog/posts", async (req, res) => {
    console.log("moi");
    res.status(200).json(await model.getBlogposts());
  });

  router.get("/blog/post/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await model.getBlogpost(id));
  });
  return router;
};
