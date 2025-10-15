 const STATUS_MESSAGES = {
  OK: "Success",
  CREATED: "Resource Created",
  BAD_REQUEST: "Bad Request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not Found",
  FILE_TOO_LARGE: "File Too Large",
  UNSUPPORTED_MEDIA_TYPE: "Unsupported Media Type",
  UNPROCESSABLE_ENTITY: "Unprocessable Entity",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  SERVICE_UNAVAILABLE: "Service Unavailable",
  IMAGE_REQUIRED:"Both front and back images are required",
  ERROR_PROCESSING:'Error processing images'
};
module.exports = { STATUS_MESSAGES }; 
