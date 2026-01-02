export class CustomError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "CustomError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

// Error code mappings
export const ERROR_CODES = {
  // Auth Errors (400-401)
  EMAIL_ALREADY_EXISTS: { code: "EMAIL_ALREADY_EXISTS", status: 409 },
  EMAIL_NOT_MATCH: { code: "EMAIL_NOT_MATCH", status: 401 },
  PASSWORD_NOT_MATCH: { code: "PASSWORD_NOT_MATCH", status: 401 },
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", status: 404 },
  REJECTED: { code: "ACCOUNT_REJECTED", status: 403 },
  SUSPENDED: { code: "ACCOUNT_SUSPENDED", status: 403 },

  // Authentication Errors (401)
  AUTH_TOKEN_MISSING: { code: "AUTH_TOKEN_MISSING", status: 401 },
  AUTH_TOKEN_INVALID: { code: "AUTH_TOKEN_INVALID", status: 401 },
  AUTH_TOKEN_EXPIRED: { code: "AUTH_TOKEN_EXPIRED", status: 401 },
  AUTH_UNAUTHORIZED: { code: "AUTH_UNAUTHORIZED", status: 401 },

  // Validation Errors (400)
  VALIDATION_FAILED: { code: "VALIDATION_FAILED", status: 400 },
  MISSING_REQUIRED_FIELDS: { code: "MISSING_REQUIRED_FIELDS", status: 400 },
  MISSING_REQUIRED_PARAMS: { code: "MISSING_REQUIRED_PARAMS", status: 400 },
  REQUIRED_FIELD_MISSING: { code: "REQUIRED_FIELD_MISSING", status: 400 },
  INVALID_VALUE: { code: "INVALID_VALUE", status: 400 },
  INVALID_RANGE: { code: "INVALID_RANGE", status: 400 },
  INVALID_ENUM: { code: "INVALID_ENUM", status: 400 },
  INVALID_DATE: { code: "INVALID_DATE", status: 400 },
  INVALID_DEADLINE: { code: "INVALID_DEADLINE", status: 400 },
  INVALID_ARRAY: { code: "INVALID_ARRAY", status: 400 },
  INVALID_LENGTH: { code: "INVALID_LENGTH", status: 400 },
  NO_DOC_UPLOADED: { code: "NO_DOC_UPLOADED", status: 400 },

  // Resource Errors (404)
  REQUIREMENT_NOT_FOUND: { code: "REQUIREMENT_NOT_FOUND", status: 404 },
  NOTIFICATION_NOT_FOUND: { code: "NOTIFICATION_NOT_FOUND", status: 404 },
  BID_NOT_FOUND: { code: "BID_NOT_FOUND", status: 404 },
  CONVERSATION_NOT_FOUND: { code: "CONVERSATION_NOT_FOUND", status: 404 },
  MESSAGE_NOT_FOUND: { code: "MESSAGE_NOT_FOUND", status: 404 },
  DEAL_NOT_FOUND: { code: "DEAL_NOT_FOUND", status: 404 },
  ESCROW_NOT_FOUND: { code: "ESCROW_NOT_FOUND", status: 404 },

  // Permission Errors (403)
  EDIT_NOT_ALLOWED: { code: "EDIT_NOT_ALLOWED", status: 403 },
  DELETE_NOT_ALLOWED: { code: "DELETE_NOT_ALLOWED", status: 403 },
  UPDATE_NOT_ALLOWED: { code: "UPDATE_NOT_ALLOWED", status: 403 },
  WITHDRAW_NOT_ALLOWED: { code: "WITHDRAW_NOT_ALLOWED", status: 403 },
  ACCESS_DENIED: { code: "ACCESS_DENIED", status: 403 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 403 },
  BID_NOT_ALLOWED: { code: "BID_NOT_ALLOWED", status: 403 },
  ACCEPT_NOT_ALLOWED: { code: "ACCEPT_NOT_ALLOWED", status: 403 },
  REJECT_NOT_ALLOWED: { code: "REJECT_NOT_ALLOWED", status: 403 },
  NOT_CONVERSATION_PARTICIPANT: {
    code: "NOT_CONVERSATION_PARTICIPANT",
    status: 403,
  },
  UNAUTHORIZED_ESCROW_ACTION: {
    code: "UNAUTHORIZED_ESCROW_ACTION",
    status: 403,
  },

  // Business Logic Errors (422)
  REQUIREMENT_EXPIRED: { code: "REQUIREMENT_EXPIRED", status: 422 },
  REQUIREMENT_CLOSED: { code: "REQUIREMENT_CLOSED", status: 422 },
  BUDGET_TOO_LOW: { code: "BUDGET_TOO_LOW", status: 422 },
  DEADLINE_TOO_SHORT: { code: "DEADLINE_TOO_SHORT", status: 422 },
  ALREADY_ACCEPTED: { code: "ALREADY_ACCEPTED", status: 422 },
  ALREADY_REJECTED: { code: "ALREADY_REJECTED", status: 422 },
  MESSAGE_TOO_LONG: { code: "MESSAGE_TOO_LONG", status: 422 },
  ATTACHMENT_TOO_LARGE: { code: "ATTACHMENT_TOO_LARGE", status: 422 },
  TOO_MANY_ATTACHMENTS: { code: "TOO_MANY_ATTACHMENTS", status: 422 },
  INVALID_CONVERSATION_CONTEXT: {
    code: "INVALID_CONVERSATION_CONTEXT",
    status: 422,
  },
  CONFIRMATIONS_INCOMPLETE: { code: "CONFIRMATIONS_INCOMPLETE", status: 422 },
  ESCROW_INVALID_STATUS: { code: "ESCROW_INVALID_STATUS", status: 422 },
  REFUND_INVALID_AMOUNT: { code: "REFUND_INVALID_AMOUNT", status: 422 },

  // Conflict Errors (409)
  DUPLICATE_BID: { code: "DUPLICATE_BID", status: 409 },
  DEAL_ALREADY_EXISTS: { code: "DEAL_ALREADY_EXISTS", status: 409 },
  BID_NOT_ACCEPTED: { code: "BID_NOT_ACCEPTED", status: 409 },
  ESCROW_ALREADY_EXISTS: { code: "ESCROW_ALREADY_EXISTS", status: 409 },
  ESCROW_ALREADY_RELEASED: { code: "ESCROW_ALREADY_RELEASED", status: 409 },
  ESCROW_ALREADY_REFUNDED: { code: "ESCROW_ALREADY_REFUNDED", status: 409 },

  // Payment Errors (402)
  PAYMENT_DECLINED: { code: "PAYMENT_DECLINED", status: 402 },
  PAYMENT_FAILED: { code: "PAYMENT_FAILED", status: 402 },
  INSUFFICIENT_FUNDS: { code: "INSUFFICIENT_FUNDS", status: 402 },
  INVALID_PAYMENT_METHOD: { code: "INVALID_PAYMENT_METHOD", status: 400 },
  TRANSFER_FAILED: { code: "TRANSFER_FAILED", status: 500 },
  REFUND_FAILED: { code: "REFUND_FAILED", status: 500 },

  // Server Errors (500)
  INTERNAL_SERVER_ERROR: { code: "INTERNAL_SERVER_ERROR", status: 500 },
  DATABASE_ERROR: { code: "DATABASE_ERROR", status: 500 },
  NOTIFICATION_SERVICE_ERROR: {
    code: "NOTIFICATION_SERVICE_ERROR",
    status: 500,
  },
};

// Helper function to throw custom error
export const throwError = (
  messageKey: keyof typeof ERROR_CODES,
  customMessage?: string
) => {
  const errorConfig = ERROR_CODES[messageKey];
  if (!errorConfig) {
    throw new CustomError(
      customMessage || "An error occurred",
      "UNKNOWN_ERROR",
      500
    );
  }

  throw new CustomError(
    customMessage || messageKey.toString(),
    errorConfig.code,
    errorConfig.status
  );
};
