const express = require("express");
const cors = require("cors");
const { STATUS_MESSAGES } = require("./constants/MESSAGES");
const { STATUS_CODES } = require("./constants/STATUS_CODES");

const ocrRoutes = require("./src/routes/ocr.routes");
require("dotenv").config();
const app = express();
app.use(
  cors({
    origin: [
      process.env.NODE_ENV == "dev"
        ? process.env.FRONTEND_DEV_URL
        : process.env.FRONTEND_PROD_URL,
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/ocr", ocrRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Aadhaar API is running!" });
});
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});
app.use((req, res) => {
  res.status(STATUS_CODES.NOT_FOUND).json({ error: STATUS_MESSAGES.NOT_FOUND });
});
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    error: err.message || STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
  });
});
module.exports = app;
