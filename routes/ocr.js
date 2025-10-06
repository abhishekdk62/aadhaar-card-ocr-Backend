const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");

router.post(
  "/process",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const frontImage = req.files?.frontImage?.[0];
      const backImage = req.files?.backImage?.[0];
      
      if (!frontImage || !backImage) {
        return res.status(400).json({
          success: false,
          message: "Both front and back images are required",
        });
      }
      
      console.log("Processing images with OCR.Space API...");
      
      // Use .buffer instead of .path
      const frontText = await processImageWithOCRSpace(frontImage.buffer, "front");
      const backText = await processImageWithOCRSpace(backImage.buffer, "back");
      const extractedData = extractAadhaarInfo(frontText, backText);
      
      res.json({
        success: true,
        data: {
          frontText: frontText,
          backText: backText,
          extractedInfo: extractedData,
        },
      });
      
      // NO CLEANUP NEEDED - buffers are auto garbage collected
      
    } catch (error) {
      console.error("OCR processing error:", error);
      res.status(500).json({
        success: false,
        message: "Error processing images",
        error: error.message,
      });
    }
  }
);

// Process from buffer instead of file path
async function processImageWithOCRSpace(imageBuffer, side) {
  try {
    console.log(`Processing ${side} image...`);

    // Compress buffer in memory
    const compressedBuffer = await sharp(imageBuffer)
      .resize(null, 1200, { withoutEnlargement: false })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const formData = new FormData();
    
    // Append buffer with filename
    formData.append("file", compressedBuffer, {
      filename: `${side}.jpg`,
      contentType: "image/jpeg"
    });
    
    formData.append("apikey", "helloworld");
    formData.append("language", "eng");
    formData.append("OCREngine", "2");
    
    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: { ...formData.getHeaders() },
        timeout: 90000,
      }
    );

    if (response.data.ParsedResults?.[0]?.ParsedText) {
      const text = response.data.ParsedResults[0].ParsedText;
      console.log(`${side} processed successfully - ${text.length} characters`);
      return text;
    } else {
      throw new Error(`No text found from ${side} image`);
    }
  } catch (error) {
    console.error(`OCR error for ${side}:`, error.message);
    throw error;
  }
}

function extractAadhaarInfo(frontText, backText) {
  const combinedText = frontText + " " + backText;

  console.log("=== EXTRACTED TEXT ===");
  console.log("Front:", frontText.substring(0, 100) + "...");
  console.log("Back:", backText.substring(0, 100) + "...");
  console.log("=====================");

  const extractedData = {
    aadhaarNumber: null,
    name: null,
    dob: null,
    gender: null,
    address: null,
  };

  const aadhaarMatch = combinedText.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
  if (aadhaarMatch) {
    const cleaned = aadhaarMatch[0].replace(/\s/g, "");
    if (cleaned.length === 12) {
      extractedData.aadhaarNumber = cleaned;
      console.log("Found Aadhaar Number:", cleaned);
    }
  }
  
  const dobMatch =
    combinedText.match(/DOB[:\s]*(\d{2}\/\d{2}\/\d{4})/i) ||
    combinedText.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dobMatch) {
    extractedData.dob = dobMatch[1];
    console.log("Found DOB:", dobMatch[1]);
  }
  
  const genderMatch = combinedText.match(/(Male|Female|MALE|FEMALE)/i);
  if (genderMatch) {
    extractedData.gender = genderMatch[1].toLowerCase();
    console.log("Found Gender:", genderMatch[1]);
  }

  const nameMatch = frontText.match(
    /Government of India[^\n]*\n\s*([A-Za-z\s\.]{3,50})/i
  );
  if (nameMatch) {
    extractedData.name = nameMatch[1].trim();
    console.log("Found Name:", nameMatch[1].trim());
  }
  
  const addressMatch = backText.match(/Address[:\s]+(.*?)(?:\d{6}|$)/is);
  if (addressMatch) {
    extractedData.address = addressMatch[1].trim().substring(0, 200);
    console.log(
      "Found Address:",
      extractedData.address.substring(0, 50) + "..."
    );
  }

  return extractedData;
}

module.exports = router;
