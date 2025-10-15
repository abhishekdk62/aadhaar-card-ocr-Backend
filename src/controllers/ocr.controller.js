const { STATUS_MESSAGES } = require("../../constants/MESSAGES");
const { STATUS_CODES } = require("../../constants/STATUS_CODES");
const ocrService = require("../services/ocr.service");

class OCRController {
  async processAadhaar(req, res) {
    try {
      const frontImage = req.files?.frontImage?.[0];
      const backImage = req.files?.backImage?.[0];
      if (!frontImage || !backImage) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          error: STATUS_MESSAGES.IMAGE_REQUIRED,
        });
      }

      const result = await ocrService.processAadhaarImages(
        frontImage.buffer,
        backImage.buffer
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error("OCR Error:", err);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: err?.message || STATUS_MESSAGES.ERROR_PROCESSING,
      });
    }
  }
}

module.exports = new OCRController();
