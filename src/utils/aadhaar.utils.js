const { STATUS_MESSAGES } = require("../../constants/MESSAGES");
const ValidationError = require("../errors/ValidationError");
const textUtils = require("./text.utils");

class AadhaarUtils {
  extractAadhaarInfo(frontText, backText) {
    const cleanedFront = textUtils.cleanOCRText(frontText);
    const cleanedBack = textUtils.cleanOCRText(backText);
    const combined = `${cleanedFront}\n${cleanedBack}`.replace(/[|]/g, "I");
    const extractedData = {
      aadhaarNumber: null,
      aadhaarMasked: null,
      name: null,
      dob: null,
      gender: null,
      address: null,
    };

    const frontAadhaarNumber = this._extractAadhaarNumber(cleanedFront);
    const backAadhaarNumber = this._extractAadhaarNumber(cleanedBack);
    console.log(frontAadhaarNumber);
    console.log(backAadhaarNumber);

    if (!frontAadhaarNumber || !backAadhaarNumber) {
      throw new ValidationError(STATUS_MESSAGES.ADHAAR_NOT_VALID, 400);
    }

    if (frontAadhaarNumber !== backAadhaarNumber) {
      throw new ValidationError(
        STATUS_MESSAGES.ADHAAR_NUMBER_DO_NOT_MATCH,
        400
      );
    }
    extractedData.aadhaarNumber = frontAadhaarNumber;
    extractedData.aadhaarMasked = `XXXX-XXXX-${frontAadhaarNumber.slice(-4)}`;

    this._extractDOB(combined, extractedData);
    this._extractGender(combined, extractedData);
    this._extractName(cleanedFront, extractedData);
    this._extractAddress(cleanedBack, extractedData);
    return extractedData;
  }
  _extractAadhaarNumber(text) {
    console.log("=== Extracting from text ===");
    console.log(text.substring(0, 300));

    const validUids = [];

    const tokens = text.split(/\s+/);

    for (let i = 0; i < tokens.length - 2; i++) {
      const token1 = tokens[i];
      const token2 = tokens[i + 1];
      const token3 = tokens[i + 2];

      if (
        /^\d{4}$/.test(token1) &&
        /^\d{4}$/.test(token2) &&
        /^\d{4}$/.test(token3)
      ) {
        const uid = token1 + token2 + token3;
        console.log("Found match:", token1, token2, token3, "-> UID:", uid);

        if (uid[0] >= "2" && uid[0] <= "9") {
          validUids.push(uid);
          console.log("✓ Valid UID:", uid);
        } else {
          console.log("✗ Invalid first digit:", uid);
        }
      }
    }

    if (validUids.length > 0) {
      const selectedUid = validUids[validUids.length - 1];
      console.log("Selected UID:", selectedUid);
      return selectedUid;
    }

    console.log("No valid UID found");
    return null;
  }

  _extractDOB(text, data) {
    const dobMatch =
      text.match(/DOB\s*[:\s-]*\s*([0-3]?\d\s*\/\s*[01]?\d\s*\/\s*\d{4})/i) ||
      text.match(/\b([0-3]\d\s*\/\s*[01]\d\s*\/\s*\d{4})\b/);
    if (dobMatch) {
      data.dob = dobMatch[1].replace(/\s/g, "");
    }
  }

  _extractGender(text, data) {
    const genderMatch = text.match(/\b(MALE|FEMALE)\b/i);
    if (genderMatch) {
      data.gender = genderMatch[0].toLowerCase();
    }
  }

  _extractName(frontText, data) {
    const lines = frontText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const giIndex = lines.findIndex((l) => /government\s+of\s+india/i.test(l));
    if (giIndex >= 0 && lines[giIndex + 1]) {
      const nextLine = lines[giIndex + 1];
      if (nextLine.length >= 3 && nextLine.length <= 60) {
        data.name = nextLine.toUpperCase().replace(/[0-9]/g, "").trim();
      }
    }
  }

  _extractAddress(backText, data) {
    const back = backText.replace(/\r/g, "");
    const addrBlock = back.match(/Address[:\s]*([\s\S]+?)(?:\b\d{6}\b|$)/i);
    if (addrBlock) {
      let addr = addrBlock[1]
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
      const pin = addr.match(/\b\d{6}\b/);
      if (pin) {
        addr = addr.slice(0, addr.indexOf(pin[0]) + 6);
      }
      data.address = addr.slice(0, 300);
    }
  }
}

module.exports = new AadhaarUtils();
