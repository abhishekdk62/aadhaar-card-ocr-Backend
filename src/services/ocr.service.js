const tesseractRepository = require('../repositories/tesseract.repository');
const imageService = require('./image.service');
const aadhaarUtils = require('../utils/aadhaar.utils');
class OCRService {
 async processAadhaarImages(frontImageBuffer, backImageBuffer) {
  try {
    console.log("Preprocessing front image...");
    const frontPreprocessed = await imageService.preprocess(frontImageBuffer);
    const backPreprocessed = await imageService.preprocess(backImageBuffer);
    
    const frontResult = await tesseractRepository.recognize(frontPreprocessed);
    const backResult = await tesseractRepository.recognize(backPreprocessed);
    
    const extractedInfo = aadhaarUtils.extractAadhaarInfo(
      frontResult.text || "", 
      backResult.text || ""
    );
    console.log("frontResult.text",frontResult.text);
    console.log("backResult.text",backResult.text);
    
    return {
      frontText: frontResult.text,
      backText: backResult.text,
      confidence: {
        front: frontResult.confidence,
        back: backResult.confidence,//? this confidene is the power of the asumption
      },
      extractedInfo,
    };
  } catch (error) {
    console.error("Error processing Aadhaar images:", error);
    throw error; 
  }
}

}
module.exports = new OCRService();
