const ErrorHandler = require("../middlewares/error-middleware");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "application/pdf"
]);

function validateFile(req, res, next) {
  if (!req.file) {
    return new ErrorHandler(req, res).error({ message: "A file is required." });
  }

  if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
    return new ErrorHandler(req, res).error({ message: "Unsupported file type. Allowed: images, videos, audio and PDF." });
  }

  next();
}

function validateFileForUpdate(req, res, next) {
  if (!req.params.id) {
    return new ErrorHandler(req, res).error({ message: "File ID is required." });
  }

  next();
}


function normalizeTags(tags) {
  if (!tags) return [];

  let tagsArray = tags;

  if (typeof tags === "string") {
    try {
      tagsArray = JSON.parse(tags);
    } catch (error) {
      tagsArray = tags.split(",");
    }
  }

  if (!Array.isArray(tagsArray)) return [];

  const data = [
    ...new Set(tagsArray
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20)
    )
  ];
  return data;
}

module.exports = { validateFile, validateFileForUpdate, normalizeTags };
