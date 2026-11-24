const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");

const uploadImage = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(buffer)) {
      return reject(new Error("A valid image buffer is required"));
    }

    if (typeof folder !== "string" || !folder.trim()) {
      return reject(new Error("A valid Cloudinary folder is required"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `made-and-shared/${folder}`,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result || !result.secure_url || !result.public_id) {
          return reject(new Error("Cloudinary did not return a valid image result"));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.on("error", reject);

    Readable.from([buffer]).pipe(uploadStream);
  });
};

const deleteImage = async (publicId) => {
  if (typeof publicId !== "string" || !publicId.trim()) {
    throw new Error("A valid Cloudinary public ID is required");
  }

  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadImage,
  deleteImage
};
