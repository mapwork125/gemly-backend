export const handleError = (err, req, res, next) => {
  console.error(err?.message || "Server Error");

  const status = err.statusCode || err.status || 500;
  const code = err.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");

  // Handle Joi validation errors
  if (err.isJoi && err.details) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_FAILED",
      errors: err.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        code: "INVALID_VALUE",
      })),
      timestamp: new Date().toISOString(),
    });
  }

  // Handle custom errors with code
  if (err.code) {
    return res.status(status).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
  }

  // Default error response
  res.status(status).json({
    success: false,
    message: err.message || "Server Error",
    code,
    timestamp: new Date().toISOString(),
  });
};
