const express = require("express");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const admin = require("firebase-admin");
const tf = require("@tensorflow/tfjs-node");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const path = require("path");

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Resolve paths to key files
const storageKeyPath = path.resolve(__dirname, "./utils/storageKey.json");
const databaseKeyPath = path.resolve(__dirname, "./utils/databaseKey.json");

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: storageKeyPath });
const bucketName = "submissionmlgc-ibnufadhil-mlmodel";
const bucket = storage.bucket(bucketName);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require(databaseKeyPath)),
});
const db = admin.firestore();

// Set up Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000000 }, // Max size 1MB
});

// Load model directly from Cloud Storage
let model;
(async () => {
  try {
    model = await tf.loadGraphModel(
      "https://storage.googleapis.com/ml-models-asclepius/models/model.json"
    );
    console.log("Model loaded successfully from Cloud Storage");
  } catch (error) {
    console.error("Failed to load model:", error);
  }
})();

// Predict endpoint
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    const { buffer, mimetype } = req.file;
    if (!mimetype.startsWith("image/")) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid file type. Please upload an image.",
      });
    }

    // Upload image to the specified folder in Cloud Storage
    const imageId = uuidv4();
    const filePath = `uploaded_images/${imageId}`;
    const file = bucket.file(filePath);
    await file.save(buffer, {
      contentType: req.file.mimetype,
    });

    // Generate the public URL
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Perform prediction
    const imageTensor = tf.node
      .decodeJpeg(buffer)
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .toFloat();

    const prediction = model.predict(imageTensor).dataSync();

    // Determine result based on prediction
    const isCancer = prediction[0] > 0.5; // Assuming binary classification: 1 = Cancer, 0 = Non-Cancer
    const result = isCancer ? "Cancer" : "Non-cancer";
    const suggestion = isCancer
      ? "Segera periksa ke dokter!"
      : "Penyakit kanker tidak terdeteksi.";

    // Save prediction result to Firestore
    const createdAt = new Date().toISOString();
    const data = {
      id: imageId,
      result,
      suggestion,
      createdAt,
      imageUrl, // Include the image URL in the response
    };
    await db.collection("predictions").doc(imageId).set(data);

    return res.status(200).json({
      status: "success",
      message: "Model is predicted successfully",
      data,
    });
  } catch (error) {
    console.error("Prediction Error:", error);
    return res.status(400).json({
      status: "fail",
      message: "Terjadi kesalahan dalam melakukan prediksi",
    });
  }
});

// Handle file size error
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      status: "fail",
      message: "Payload content length greater than maximum allowed: 1000000",
    });
  }
  next(err);
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
