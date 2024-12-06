const express = require("express");
const { getHistoryHandler } = require("../controllers/historyHandler");

const historyRoute = express.Router();
historyRoute.get("/", getHistoryHandler);

module.exports = historyRoute;
