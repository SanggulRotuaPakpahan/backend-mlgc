const express = require("express");
const { getHistoryHandler } = require("../controllers/historyControllers");

const historyRoute = express.Router();
historyRoute.get("/", getHistoryHandler);

module.exports = historyRoute;
