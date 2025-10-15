const sharp = require("sharp");
class ImageService {
  async preprocess(buffer) {
    return await sharp(buffer)
      .resize({ height: 600 })
      .grayscale()
      .normalise()
      .threshold(128)
      .jpeg({ quality: 70 })
      .toBuffer();
  }
}
module.exports = new ImageService();
