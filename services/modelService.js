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

  const prediction = await model.predict(tensor).data();
    const result = prediction[0] > 0.5 ? 'Cancer' : 'Non-cancer';

    let suggestion;

    if (result === 'Cancer') {
      suggestion = 'Segera periksa ke dokter!';
    } else if (result === 'Non-cancer') {
      suggestion = 'Penyakit kanker tidak terdeteksi.';
    }
  
    return { result, suggestion };
  } catch (error) {
    throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
  }

};

module.exports = { predictImage };
