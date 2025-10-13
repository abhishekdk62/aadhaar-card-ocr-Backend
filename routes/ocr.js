const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");
require("dotenv").config();

const TESS_LANG = process.env.TESS_LANG || "eng";

let worker = null;

async function ensureWorker() {
  if (worker) return worker;
  
  worker = await Tesseract.createWorker(TESS_LANG, 1, {});
  
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    preserve_interword_spaces: '1',
  });
  
  return worker;
}

async function preprocess(buffer) {
  return await sharp(buffer)
    .resize({ height: 800 }) // Changed from 1500
    .grayscale()
    .normalise()
    .threshold(128)
    .jpeg({ quality: 80 }) // Changed from 92
    .toBuffer();
}

async function runOCR(imageBuffer) {
  const w = await ensureWorker();
  const { data } = await w.recognize(imageBuffer);
  return { text: data.text || "", confidence: data.confidence || null };
}

function cleanOCRText(text) {
  return text
    .replace(/[=~_*§|&]+/g, ' ')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[@#$%^<>]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ✅ NEW CODE - Extract name from line after "Government of India"
function extractAadhaarInfo(frontText, backText) {
  const cleanedFront = cleanOCRText(frontText);
  const cleanedBack = cleanOCRText(backText);
  const combined = `${cleanedFront}\n${cleanedBack}`.replace(/[|]/g, "I");

  console.log("Cleaned Front Text:", cleanedFront);

  const out = {
    aadhaarNumber: null,
    aadhaarMasked: null,
    name: null,
    dob: null,
    gender: null,
    address: null,
    confidenceNote: "Field values depend on OCR quality and preprocessing.",
  };

  // Extract Aadhaar Number
  const uidMatch = combined.match(/\b(\d{4})\s*(\d{4})\s*(\d{4})\b/);
  if (uidMatch) {
    const uid = (uidMatch[1] + uidMatch[2] + uidMatch[3]).trim();
    if (uid.length === 12) {
      out.aadhaarNumber = uid;
      out.aadhaarMasked = `XXXX-XXXX-${uid.slice(-4)}`;
    }
  }

  // Extract DOB
  const dobMatch =
    combined.match(/DOB\s*[:\s-]*\s*([0-3]?\d\s*\/\s*[01]?\d\s*\/\s*\d{4})/i) ||
    combined.match(/Date\s+of\s+Birth\s*[:\s-]*\s*([0-3]?\d\s*\/\s*[01]?\d\s*\/\s*\d{4})/i) ||
    combined.match(/\b([0-3]\d\s*\/\s*[01]\d\s*\/\s*\d{4})\b/);
  
  if (dobMatch) {
    out.dob = dobMatch[1].replace(/\s/g, '');
  }

  const yobMatch = combined.match(/Year\s+of\s+Birth\s*[:\s-]*\s*(\d{4})/i);
  if (!out.dob && yobMatch) out.dob = yobMatch[1];

  // Extract Gender
  const genderMatch = combined.match(/\b(MALE|FEMALE|Male|Female|Transgender)\b/i);
  if (genderMatch) out.gender = genderMatch[0].toLowerCase();

  // ✅ NAME EXTRACTION - Get line after "Government of India"
  const linesFront = cleanedFront.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  let nameCandidate = null;

  console.log("=== All Front Lines ===");
  linesFront.forEach((line, idx) => console.log(`${idx}: "${line}"`));

  // Find "Government of India" line
  const giIndex = linesFront.findIndex(l => /government\s+of\s+india/i.test(l));
  
  if (giIndex >= 0) {
    console.log(`✓ Found "Government of India" at line ${giIndex}`);
    
    // Check the next line
    const nextLine = linesFront[giIndex + 1];
    
    if (nextLine) {
      console.log(`Checking next line ${giIndex + 1}: "${nextLine}"`);
      
      // Pattern 1: Initials + Name (A.R.Ramachandran)
      let nameMatch = nextLine.match(/^([A-Z]\.[A-Z]\.[A-Z][a-z]+)$/i);
      if (!nameMatch) nameMatch = nextLine.match(/^([A-Z]\.[A-Z][a-z]+)$/i);
      
      // Pattern 2: Regular name (Mohammed Saif Faroogqi)
      if (!nameMatch) {
        nameMatch = nextLine.match(/^([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3})$/i);
      }
      
      // Pattern 3: All caps (JOHN DOE)
      if (!nameMatch) {
        nameMatch = nextLine.match(/^([A-Z\.\s]{3,60})$/);
      }
      
      if (nameMatch) {
        const potentialName = nameMatch[1] || nameMatch[0];
        
        // Exclude noise words
        const excludeWords = /^(government|india|card|aadhaar|address|male|female|uid|dob|authority|identification|unique|sewer|adue|sas|ttt|hippies|smme|mrer|eine|eyly|ate|ahs|sifefmrisld)$/i;
        
        if (
          !excludeWords.test(potentialName.trim()) &&
          potentialName.length >= 3 &&
          potentialName.length <= 60
        ) {
          nameCandidate = potentialName;
          console.log(`✓ Found valid name: "${nameCandidate}"`);
        } else {
          console.log(`✗ Excluded noise: "${potentialName}"`);
        }
      } else {
        console.log(`✗ No name pattern matched in: "${nextLine}"`);
      }
    } else {
      console.log("✗ No line found after 'Government of India'");
    }
  } else {
    console.log("✗ 'Government of India' text not found");
  }

  // Format the name
  if (nameCandidate) {
    out.name = nameCandidate
      .replace(/\s{2,}/g, ' ')
      .replace(/[0-9]/g, '')
      .replace(/\.{2,}/g, '.')
      .trim()
      .toUpperCase();
    
    console.log("✓✓✓ FINAL NAME:", out.name);
  } else {
    console.log("✗✗✗ NO NAME EXTRACTED");
  }

  // Extract Address
  const back = cleanedBack.replace(/\r/g, "");
  const addrBlock =
    back.match(/Address[:\s]*([\s\S]+?)(?:\b\d{6}\b|$)/i) ||
    back.match(/(?:S\/O|W\/O|C\/O)[:\s]*([\s\S]+?)(?:\b\d{6}\b|$)/i);
  if (addrBlock) {
    let addr = addrBlock[1]
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .join(", ");
    const pin = addr.match(/\b\d{6}\b/);
    if (pin) {
      const idx = addr.indexOf(pin[0]) + 6;
      addr = addr.slice(0, idx);
    }
    out.address = addr.slice(0, 300);
  }

  return out;
}

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
          error: "Both front and back images are required",
        });
      }

      console.log("Preprocessing images...");
      const [frontPre, backPre] = await Promise.all([
        preprocess(frontImage.buffer),
        preprocess(backImage.buffer),
      ]);

      console.log("Running OCR...");
      const [frontRes, backRes] = await Promise.all([
        runOCR(frontPre),
        runOCR(backPre),
      ]);

      console.log("Parsing Aadhaar data...");
      const parsed = extractAadhaarInfo(frontRes.text || "", backRes.text || "");

      return res.json({
        success: true,
        data: {
          frontText: frontRes.text,
          backText: backRes.text,
          confidence: {
            front: frontRes.confidence,
            back: backRes.confidence,
          },
          extractedInfo: parsed,
        },
      });
    } catch (err) {
      console.error("OCR Error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Error processing images",
      });
    }
  }
);

process.on("SIGINT", async () => {
  if (worker) {
    await worker.terminate();
  }
  process.exit(0);
});

module.exports = router;
