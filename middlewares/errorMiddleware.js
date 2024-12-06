const errorMiddleware = (err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        status: "fail",
        message: "Payload content length greater than maximum allowed: 1000000",
      });
    }
    next(err);
  };
  
  module.exports = { errorMiddleware };
  