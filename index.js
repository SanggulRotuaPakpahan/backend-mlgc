const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Tambahkan ini
const predictRoute = require("./routes/predictRoute");
const historyRoute = require("./routes/historyRoute");
const { errorMiddleware } = require("./middlewares/errorMiddleware");

const app = express();

// Tambahkan Middleware CORS
app.use(cors({
  origin: 'http://submissionmlgc-sanggulrotuap.et.r.appspot.com', // Ganti dengan origin front-end Anda
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metode yang diizinkan
  allowedHeaders: ['Content-Type', 'Authorization'], // Header yang diizinkan
}));

// Middleware untuk parsing body request
app.use(bodyParser.json());

// Rute API
app.use("/predict", predictRoute);
app.use("/predict/histories", historyRoute);

// Middleware untuk menangani error
app.use(errorMiddleware);

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
