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

const config = require("./config/config");
const db = require("./config/db");
const GLOBAL_DATA = db.getGlobalData();

module.exports = async app => {
  return app;
};
