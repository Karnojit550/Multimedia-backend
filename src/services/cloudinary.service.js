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
  let cloudinaryResourceType = "raw";

  if (file.mimetype.startsWith("image/")) {
    resourceType = "image";
    cloudinaryResourceType = "image";
  } else if (file.mimetype.startsWith("video/")) {
    resourceType = "video";
    cloudinaryResourceType = "video";
  } else if (file.mimetype.startsWith("audio/")) {
    // Cloudinary stores audio files under its video resource type, while the
    // application keeps the more useful audio type in MongoDB.
    resourceType = "audio";
    cloudinaryResourceType = "video";
  } else if (file.mimetype === "application/pdf") {
    resourceType = "raw";
    cloudinaryResourceType = "raw";
  } else {
    throw new Error("Unsupported file type");
  }

  const result = await uploadBuffer(file.buffer, {
    resource_type: cloudinaryResourceType,
    folder: "multimedia-app",
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    resourceType
  };
}

async function destroyMedia(publicId, resourceType) {
  const cloudinaryResourceType = resourceType === "audio" ? "video" : resourceType;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: cloudinaryResourceType
  });
}

module.exports = { uploadMedia, destroyMedia };
