const { v2: cloudinary } = require("cloudinary");
const { cloudinary: config } = require("./env");

const missing = ["cloudName", "apiKey", "apiSecret"].filter((key) => !config[key]);

if (missing.length) {
  throw new Error(`Missing Cloudinary configuration: ${missing.join(", ")}`);
}

cloudinary.config({
  cloud_name: config.cloudName,
  api_key: config.apiKey,
  api_secret: config.apiSecret
});



module.exports = cloudinary;
