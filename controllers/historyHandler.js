const { getPredictionHistories } = require("../services/databaseService");

const getHistoryHandler = async (req, res) => {
  try {
    const histories = await getPredictionHistories();

    return res.status(200).json({
      status: "success",
      data: histories,
    });
  } catch (error) {
    console.error("Error fetching prediction histories:", error);
    return res.status(500).json({
      status: "fail",
      message: "Terjadi kesalahan dalam mengambil riwayat prediksi",
    });
  }
};

module.exports = { getHistoryHandler };
