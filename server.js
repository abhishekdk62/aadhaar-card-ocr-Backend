const express = require('express');
const cors = require('cors');
const path = require('path');
const ocrRoutes = require('./routes/ocr');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/ocr', ocrRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Aadhaar OCR API is running created by abhishek!' });
});

module.exports = app;
