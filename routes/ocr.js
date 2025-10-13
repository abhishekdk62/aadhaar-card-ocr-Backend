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
  
  console.log("Creating Tesseract worker...");
  
  // ✅ Render-compatible config (persistent server, can access local files)
  worker = await Tesseract.createWorker(TESS_LANG, 1, {
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    logger: m => console.log(m),
  });
  
  console.log("Worker created, setting parameters...");
  
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    preserve_interword_spaces: '1',
  });
  
  console.log("Worker ready!");
  return worker;
}

async function preprocess(buffer) {
  return await sharp(buffer)
    .resize({ height: 600 })
    .grayscale()
    .normalise()
    .threshold(128)
    .jpeg({ quality: 70 })
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

function extractAadhaarInfo(frontText, backText) {
  const cleanedFront = cleanOCRText(frontText);
  const cleanedBack = cleanOCRText(backText);
  const combined = `${cleanedFront}\n${cleanedBack}`.replace(/[|]/g, "I");

  const out = {
    aadhaarNumber: null,
    aadhaarMasked: null,
    name: null,
    dob: null,
    gender: null,
    address: null,
  };

  const uidMatch = combined.match(/\b(\d{4})\s*(\d{4})\s*(\d{4})\b/);
  if (uidMatch) {
    const uid = (uidMatch[1] + uidMatch[2] + uidMatch[3]).trim();
    if (uid.length === 12) {
      out.aadhaarNumber = uid;
      out.aadhaarMasked = `XXXX-XXXX-${uid.slice(-4)}`;
    }
  }

  const dobMatch =
    combined.match(/DOB\s*[:\s-]*\s*([0-3]?\d\s*\/\s*[01]?\d\s*\/\s*\d{4})/i) ||
    combined.match(/\b([0-3]\d\s*\/\s*[01]\d\s*\/\s*\d{4})\b/);
  
  if (dobMatch) out.dob = dobMatch[1].replace(/\s/g, '');

  const genderMatch = combined.match(/\b(MALE|FEMALE)\b/i);
  if (genderMatch) out.gender = genderMatch[0].toLowerCase();

  const linesFront = cleanedFront.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const giIndex = linesFront.findIndex(l => /government\s+of\s+india/i.test(l));
  
  if (giIndex >= 0 && linesFront[giIndex + 1]) {
    const nextLine = linesFront[giIndex + 1];
    if (nextLine.length >= 3 && nextLine.length <= 60) {
      out.name = nextLine.toUpperCase().replace(/[0-9]/g, '').trim();
    }
  }

  const back = cleanedBack.replace(/\r/g, "");
  const addrBlock = back.match(/Address[:\s]*([\s\S]+?)(?:\b\d{6}\b|$)/i);
  if (addrBlock) {
    let addr = addrBlock[1].split("\n").map(s => s.trim()).filter(Boolean).join(", ");
    const pin = addr.match(/\b\d{6}\b/);
    if (pin) addr = addr.slice(0, addr.indexOf(pin[0]) + 6);
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

      console.log("Preprocessing front image...");
      const frontPre = await preprocess(frontImage.buffer);
      
      console.log("Running OCR on front...");
      const frontRes = await runOCR(frontPre);
      
      console.log("Preprocessing back image...");
      const backPre = await preprocess(backImage.buffer);
      
      console.log("Running OCR on back...");
      const backRes = await runOCR(backPre);

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

module.exports = router;
