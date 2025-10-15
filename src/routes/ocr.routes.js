const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const ocrController = require("../controllers/ocr.controller");
const multerErrorHandler = require("../middleware/multerErrorHandler");

router.post(
  "/process",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  multerErrorHandler,
  (req, res) => ocrController.processAadhaar(req, res)
);

module.exports = router;
