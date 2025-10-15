const STATUS_MESSAGES = {
  OK: "Success",
  CREATED: "Resource Created",
  BAD_REQUEST: "Bad Request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not Found",
  FILE_TOO_LARGE: "File Too Large",
  UNSUPPORTED_MEDIA_TYPE: "Unsupported Media Type",
  UNEXPECTED_FILE_FIELD:"Unexpected file field. Use frontImage and backImage",
  UNPROCESSABLE_ENTITY: "Unprocessable Entity",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  SERVICE_UNAVAILABLE: "Service Unavailable",
  TOO_MANY_FILES: "Too many files uploaded",
  IMAGE_REQUIRED: "Both front and back images are required",
  ERROR_PROCESSING: "Error processing images",
  ADHAAR_NUMBER_DO_NOT_MATCH:'Aadhaar numbers on front and back do not match',
  ADHAAR_NOT_VALID:'Please provide a valid Aadhaar card'
};
module.exports = { STATUS_MESSAGES };
