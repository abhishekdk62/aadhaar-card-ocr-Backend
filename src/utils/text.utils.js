class TextUtils {
  cleanOCRText(text) {
    return text
      .replace(/[=~_*§|&]+/g, ' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[@#$%^<>]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
}

module.exports = new TextUtils();
