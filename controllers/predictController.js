const { uploadFile } = require("../services/storageService");
const { predictImage } = require("../services/modelService");
const { savePrediction } = require("../services/databaseService");
const { v4: uuidv4 } = require("uuid");

const predictHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    const { buffer, mimetype } = req.file;

    // Upload image to Cloud Storage
    const imageId = uuidv4();
    const imageUrl = await uploadFile(buffer, mimetype, imageId);

    // Perform prediction
    const { result, suggestion } = await predictImage(buffer);

    // Save prediction result to Firestore
    const createdAt = new Date().toISOString();
    const predictionData = {
      id: imageId,
      result,
      suggestion,
      createdAt,
      // imageUrl,
    };
    await savePrediction(imageId, predictionData);

    return res.status(201).json({
      status: "success",
      message: "Model is predicted successfully",
      data: predictionData,
    });
  } catch (error) {
    console.error("Prediction Error:", error);
    return res.status(400).json({
      status: "fail",
      message: "Terjadi kesalahan dalam melakukan prediksi",
    });
  }
};

module.exports = { predictHandler };