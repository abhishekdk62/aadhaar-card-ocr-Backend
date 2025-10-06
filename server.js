const express = require('express');
const cors = require('cors');
const path = require('path');
const ocrRoutes = require('./routes/ocr');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/ocr', ocrRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Aadhaar OCR API is running!' });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
