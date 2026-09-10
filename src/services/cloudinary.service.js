const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

function uploadBuffer(buffer, options) {

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

async function uploadMedia(file) {
  let resourceType = "raw";

  if (file.mimetype.startsWith("image/")) {
    resourceType = "image";
  } else if (file.mimetype.startsWith("video/")) {
    resourceType = "video";
  } else if (file.mimetype.startsWith("audio/")) {
    // Cloudinary stores audio files with the video resource type.
    // The original MIME type is still saved in MongoDB so the frontend can
    // identify the file as audio.
    resourceType = "video";
  } else if (file.mimetype === "application/pdf") {
    resourceType = "raw";
  } else {
    throw new Error("Unsupported file type");
  }

  const result = await uploadBuffer(file.buffer, {
    resource_type: resourceType,
    folder: "multimedia-app",
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    resourceType: result.resource_type
  };
}

async function destroyMedia(publicId, resourceType) {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { uploadMedia, destroyMedia };
