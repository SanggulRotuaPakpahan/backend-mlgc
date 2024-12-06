const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storageKeyPath = path.resolve(__dirname, "../utils/storageKey.json");
const storage = new Storage({ keyFilename: storageKeyPath });
const bucketName = "ml-models-asclepius";
const bucket = storage.bucket(bucketName);

const uploadFile = async (buffer, mimetype, imageId) => {
  const filePath = `uploaded_images/${imageId}`;
  const file = bucket.file(filePath);

  await file.save(buffer, { contentType: mimetype });
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
};

module.exports = { uploadFile };
