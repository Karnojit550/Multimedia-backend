const multer = require("multer");
const { maxFileSizeMb } = require("../config/env");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024
  }
});

module.exports = upload;
