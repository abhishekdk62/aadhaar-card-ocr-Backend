const express = require('express');
const cors = require('cors');
const ocrRoutes = require('./routes/ocr');

const app = express();



app.use(cors());
app.use(express.json());
app.use('/api/ocr', ocrRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Aadhaar  API is running!' });
});

module.exports = app;
