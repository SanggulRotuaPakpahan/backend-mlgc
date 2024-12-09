const express = require("express");
const bodyParser = require("body-parser");
const predictRoute = require("./routes/predictRoute");
const historyRoute = require("./routes/historyRoute");
const { errorMiddleware } = require("./middlewares/errorMiddleware");

const app = express();
app.use(bodyParser.json());
app.use("/predict", predictRoute);
app.use("/predict/histories", historyRoute);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});