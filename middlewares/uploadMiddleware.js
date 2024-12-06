const multer = require("multer");

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000000 }, // Max size 1MB
});

module.exports = { uploadMiddleware };
