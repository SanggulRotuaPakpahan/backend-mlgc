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
const storageKeyPath = path.resolve(__dirname, "./storageKey.json");
const databaseKeyPath = path.resolve(__dirname, "./databaseKey.json");

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: storageKeyPath });
const bucketName = "ml-models-asclepius";
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
    console.log("Received request for prediction");

    // Validasi apakah file dikirim
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    const { buffer, mimetype } = req.file;

    // Validasi tipe file
    if (!mimetype.startsWith("image/")) {
      console.error("Invalid file type:", mimetype);
      return res.status(400).json({
        status: "fail",
        message: "Invalid file type. Please upload an image.",
      });
    }

    console.log("File uploaded successfully. Processing image...");

    // Upload image to Cloud Storage
    const imageId = uuidv4();
    const filePath = `uploaded_images/${imageId}`;
    const file = bucket.file(filePath);
    await file.save(buffer, {
      contentType: req.file.mimetype,
    });

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    console.log("Image uploaded to Cloud Storage:", imageUrl);

    // Decode dan buat prediksi
    const imageTensor = tf.node
      .decodeJpeg(buffer)
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .toFloat();

    console.log("Image tensor created. Running prediction...");
    const prediction = model.predict(imageTensor).dataSync();

    if (!prediction) {
      console.error("Prediction failed");
      return res.status(500).json({
        status: "fail",
        message: "Model prediction failed",
      });
    }

    // Tentukan hasil prediksi
    const isCancer = prediction[0] > 0.5; // 1 = Cancer, 0 = Non-Cancer
    const result = isCancer ? "Cancer" : "Non-cancer";
    const suggestion = isCancer
      ? "Segera periksa ke dokter!"
      : "Penyakit kanker tidak terdeteksi.";

    const createdAt = new Date().toISOString();
    const data = {
      id: imageId,
      result,
      suggestion,
      createdAt,
      imageUrl,
    };

    console.log("Prediction result:", data);

    // Simpan ke Firestore
    await db.collection("predictions").doc(imageId).set(data);

    // Berikan respons sukses
    return res.status(201).json({
      status: "success",
      message: "Model is predicted successfully",
      data,
    });
  } catch (error) {
    console.error("Error in prediction endpoint:", error);
    return res.status(500).json({
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
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
