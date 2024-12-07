const tf = require("@tensorflow/tfjs-node");

const modelUrl = "https://storage.googleapis.com/ml-models-asclepius/models/model.json";
let model;

const loadModel = async () => {
  model = await tf.loadGraphModel(modelUrl);
  console.log("Model loaded successfully");
};

loadModel();

const predictImage = async (buffer) => {
  const imageTensor = tf.node
    .decodeJpeg(buffer)
    .resizeNearestNeighbor([224, 224])
    .expandDims()
    .toFloat();

  const prediction = model.predict(imageTensor).dataSync();
  const isCancer = prediction[0] > 0.5;

  return {
    result: isCancer ? "Cancer" : "Non-cancer",
    suggestion: isCancer ? "Segera periksa ke dokter!" : "Penyakit kanker tidak terdeteksi.",
  };
};

module.exports = { predictImage };
