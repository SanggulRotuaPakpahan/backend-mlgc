const express = require("express");
const { getHistoryHandler } = require("../controllers/historyController");

const historyRoute = express.Router();
historyRoute.get("/", getHistoryHandler);

module.exports = historyRoute;
