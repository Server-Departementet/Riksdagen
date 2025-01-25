const fs = require("node:fs");
const path = require("node:path");
const URL = require("node:url");
const slug = require("limax");

const ministers = JSON.parse(fs.readFileSync(path.resolve(__dirname, "ministers.json"), "utf-8"));
const newMinisters = {};

Object.entries(ministers).forEach(([id, minister]) => {
    newMinisters[slug(id)] = minister;
});

fs.writeFileSync(path.resolve(__dirname, "ministers-formatted.json"), JSON.stringify(newMinisters, null, 2), "utf-8");