import { Request, Response, NextFunction } from "express";
import config from "../config";

/**
 * Middleware to enforce HTTPS in production
 */
export const httpsOnly = (req: Request, res: Response, next: NextFunction) => {
  if (
    config.nodeEnv === "production" &&
    !req.secure &&
    req.get("x-forwarded-proto") !== "https"
  ) {
    return res.status(403).json({
      success: false,
      error: "HTTPS connection required",
      message: "All requests must be made over HTTPS in production",
    });
  }
  next();
};

/**
 * Rate limiting store (in-memory - use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiter: 100 requests per minute per user
 */
export const rateLimiter = (req: any, res: Response, next: NextFunction) => {
  const userId = req.user?._id?.toString() || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // New window
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    res.set("Retry-After", retryAfter.toString());
    return res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter,
    });
  }

  userLimit.count++;
  next();
};

/**
 * Cleanup old rate limit entries (call periodically)
 */
export const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const [userId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(userId);
    }
  }
};

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

/**
 * Ad request rate limiter: Max 5 ad requests per user per day
 */
const adRequestStore = new Map<string, { count: number; resetTime: number }>();

export const adRequestRateLimiter = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id?.toString();

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const maxRequests = 5;

  const userLimit = adRequestStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // New window
    adRequestStore.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    const hoursRemaining = Math.ceil(retryAfter / 3600);

    res.set("Retry-After", retryAfter.toString());
    return res.status(429).json({
      success: false,
      error: "AD_REQUEST_LIMIT_EXCEEDED",
      message: `Maximum 5 ad requests per day exceeded. Try again in ${hoursRemaining} hours.`,
      retryAfter,
      limit: maxRequests,
      remaining: 0,
      resetAt: new Date(userLimit.resetTime).toISOString(),
    });
  }

  userLimit.count++;

  // Add rate limit headers
  res.set("X-RateLimit-Limit", maxRequests.toString());
  res.set("X-RateLimit-Remaining", (maxRequests - userLimit.count).toString());
  res.set("X-RateLimit-Reset", new Date(userLimit.resetTime).toISOString());

  next();
};

/**
 * Cleanup old ad request entries (call periodically)
 */
export const cleanupAdRequestStore = () => {
  const now = Date.now();
  for (const [userId, data] of adRequestStore.entries()) {
    if (now > data.resetTime) {
      adRequestStore.delete(userId);
    }
  }
};

// Cleanup every hour
setInterval(cleanupAdRequestStore, 60 * 60 * 1000);

/**
 * Audit logger middleware for escrow operations
 */
export const auditLogger = (action: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log the request
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId: req.user?._id?.toString() || "anonymous",
      userEmail: req.user?.email || "unknown",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      body: { ...req.body },
      params: { ...req.params },
    };

    // Mask sensitive data
    if (logEntry.body.paymentMethodId) {
      logEntry.body.paymentMethodId = "***MASKED***";
    }

    console.log(`[AUDIT] ${action}:`, JSON.stringify(logEntry, null, 2));

    // Log the response
    const originalSend = res.json;
    res.json = function (data: any) {
      const duration = Date.now() - startTime;
      console.log(`[AUDIT] ${action} Response:`, {
        timestamp: new Date().toISOString(),
        userId: req.user?._id?.toString(),
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        success: data.success,
      });
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Idempotency middleware to prevent duplicate operations
 */
const idempotencyStore = new Map<
  string,
  { response: any; timestamp: number }
>();

export const idempotencyMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const idempotencyKey =
    req.body.idempotencyKey || req.headers["idempotency-key"];

  if (!idempotencyKey) {
    return next();
  }

  const userId = req.user?._id?.toString();
  const key = `${userId}:${idempotencyKey}`;
  const cached = idempotencyStore.get(key);

  if (cached) {
    // Check if cached response is still valid (24 hours)
    const age = Date.now() - cached.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age < maxAge) {
      console.log(
        `[IDEMPOTENCY] Returning cached response for key: ${idempotencyKey}`
      );
      return res.status(200).json(cached.response);
    } else {
      // Expired, remove it
      idempotencyStore.delete(key);
    }
  }

  // Store the response
  const originalSend = res.json;
  res.json = function (data: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(key, {
        response: data,
        timestamp: Date.now(),
      });

      // Cleanup after 24 hours
      setTimeout(() => idempotencyStore.delete(key), 24 * 60 * 60 * 1000);
    }
    return originalSend.call(this, data);
  };

  next();
};
