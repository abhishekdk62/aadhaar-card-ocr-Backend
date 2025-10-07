# Aadhaar OCR API

A simple REST API that extracts text from Aadhaar card images (front and back) using OCR technology[web:53].

## Tech Stack

- Node.js
- Express.js
- OCR.Space API - Text recognition
- Sharp - Image compression
- Multer - File upload handling

## Features

- Upload front and back Aadhaar images
- Extract text using OCR.Space API
- Auto-extract Aadhaar number, name, DOB, gender, and address
- Image compression for faster processing
- Memory-efficient (uses buffers, no disk storage)

## Installation

npm install


## Run Server

npm start

text

Server runs on `http://localhost:5000`

## API Endpoint

**POST** `/api/ocr/process`

Upload two images (front and back of Aadhaar card)

**Request:**
Content-Type: multipart/form-data

frontImage: [file]
backImage: [file]

**Response:**
{
"success": true,
"data": {
"frontText": "extracted front text...",
"backText": "extracted back text...",
"extractedInfo": {
"aadhaarNumber": "123456789012",
"name": "John Doe",
"dob": "01/01/1990",
"gender": "male",
"address": "Complete address..."
}
}
}


## Dependencies

{
"express": "^4.x",
"multer": "^1.x",
"sharp": "^0.x",
"axios": "^1.x",
"form-data": "^4.x",
"cors": "^2.x"
}


## Project Structure

├── routes/
│ └── ocr.js # OCR processing logic
├── middleware/
│ └── upload.js # Multer config
├── server.js # Express app
└── package.json

## How It Works

1. Images uploaded via multipart/form-data
2. Sharp compresses images to reduce size
3. Images sent to OCR.Space API for text extraction
4. Regex patterns extract specific Aadhaar fields
5. JSON response returned with extracted data

## Notes

- Uses OCR.Space free API (replace with your key if needed)
- Supports JPEG, PNG image formats
- Images processed in memory (no disk writes)
- 90-second timeout for OCR processing

