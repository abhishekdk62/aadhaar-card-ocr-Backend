const Tesseract = require("tesseract.js");
require("dotenv").config();

class TesseractRepository {
  constructor() {
    this.worker = null;
    this.TESS_LANG = process.env.TESS_LANG || "eng";
  }
  async ensureWorker() {
    if (this.worker) return this.worker;
    this.worker = await Tesseract.createWorker(this.TESS_LANG, 1, {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: m => {},
    });
    await this.worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1',
    });
    console.log("Worker ready!");
    return this.worker;
  }

  async recognize(imageBuffer) {
    const worker = await this.ensureWorker();
    const { data } = await worker.recognize(imageBuffer);
    return { 
      text: data.text || "", 
      confidence: data.confidence || null 
    };
  }
  async terminateWorker() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
module.exports = new TesseractRepository();
