const multer = require("multer");
const { STATUS_CODES } = require("../../constants/STATUS_CODES");
const { STATUS_MESSAGES } = require("../../constants/MESSAGES");

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: STATUS_MESSAGES.FILE_TOO_LARGE,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: STATUS_MESSAGES.TOO_MANY_FILES,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: STATUS_MESSAGES.UNEXPECTED_FILE_FIELD,
      });
    }
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  }
  next(err);
};

module.exports = multerErrorHandler;
