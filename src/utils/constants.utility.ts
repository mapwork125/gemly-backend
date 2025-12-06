export const USER_ROLE = {
  USER: "1",
  ADMIN: "2",
};

export enum USER_TYPE {
  BUYER = "buyer",
  SELLER = "seller",
}

export enum USER_STATUS {
  PENDING_KYC = "PENDING_KYC",
  PENDING_ADMIN_APPROVAL = "PENDING_ADMIN_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export const RESPONSE_MESSAGES = {
  REGISTER_SUCCESS:
    "Registration successful. Please complete identity verification",
  MISSING_REQUIRED_FIELDS: "Missing required fields",
  MISSING_REQUIRED_PARAMS: "Missing required params",
  PENDING_KYC: "Please complete identity verification.",
  PENDING_ADMIN_APPROVAL: "Your account is awaiting admin approval.",
  REJECTED: "Your registration has been rejected. Please contact support.",
  APPROVED: "Your account is approved.",
  LOGIN_SUCCESS: "Login successful.",
  SUSPENDED: "Your account is suspended. Contact support",
  PASSWORD_NOT_MATCH: "Password is incorrect",
  EMAIL_NOT_MATCH: "Email is incorrect",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  USER_NOT_FOUND: "User not found",
  LOGGED_OUT: "Logged out successfully",
  PROFILE_UPDATED: "Profile updated",
  PROFILE_RETRIEVED: "Profile get successfully",
  NO_DOC_UPLOADED: "No document uploaded",

  // Authentication Errors (401)
  AUTH_TOKEN_MISSING: "Authorization header is missing",
  AUTH_TOKEN_INVALID: "Invalid or malformed token",
  AUTH_TOKEN_EXPIRED: "Token has expired",
  AUTH_UNAUTHORIZED: "User not authorized for this action",

  // Validation Errors (400)
  VALIDATION_FAILED: "Validation failed",
  REQUIRED_FIELD_MISSING: "Required field not provided",
  INVALID_VALUE: "Field value is invalid",
  INVALID_RANGE: "Min/Max range is invalid",
  INVALID_ENUM: "Enum value not recognized",
  INVALID_DATE: "Date format or value is invalid",
  INVALID_DEADLINE: "Deadline must be in the future",
  INVALID_ARRAY: "Array is empty when required",
  INVALID_LENGTH: "String exceeds maximum length",

  // Resource Errors (404)
  REQUIREMENT_NOT_FOUND: "Requirement does not exist",
  NOTIFICATION_NOT_FOUND: "Notification does not exist",
  BID_NOT_FOUND: "Bid does not exist",

  // Permission Errors (403)
  EDIT_NOT_ALLOWED: "Cannot edit requirement (expired/has bids)",
  DELETE_NOT_ALLOWED: "Cannot delete requirement (has bids)",
  UPDATE_NOT_ALLOWED: "Cannot update bid",
  WITHDRAW_NOT_ALLOWED: "Cannot withdraw accepted bid",
  ACCESS_DENIED: "User does not own this resource",
  UNAUTHORIZED: "Not authorized to perform this action",
  BID_NOT_ALLOWED: "Cannot bid on this requirement",
  ACCEPT_NOT_ALLOWED: "Cannot accept bid",
  REJECT_NOT_ALLOWED: "Cannot reject bid",
  ALREADY_ACCEPTED: "This bid is already accepted",
  ALREADY_REJECTED: "This bid is already rejected",

  // Business Logic Errors (422)
  REQUIREMENT_EXPIRED: "Cannot bid on expired requirement",
  REQUIREMENT_CLOSED: "Requirement is closed",
  BUDGET_TOO_LOW: "Budget unrealistic for requirements",
  DEADLINE_TOO_SHORT: "Deadline too close",

  // Conflict Errors (409)
  DUPLICATE_BID: "You have already placed a bid on this requirement",

  // Server Errors (500)
  INTERNAL_SERVER_ERROR: "Unexpected server error",
  DATABASE_ERROR: "Database operation failed",
  NOTIFICATION_SERVICE_ERROR: "Failed to send notification",

  // Deal Errors (409)
  DEAL_ALREADY_EXISTS: "Deal already exists for this bid",
  BID_NOT_ACCEPTED: "Bid must be accepted before creating deal",
  DEAL_NOT_FOUND: "Deal does not exist",
  ESCROW_NOT_FOUND: "Escrow not found",
  ESCROW_ALREADY_EXISTS: "Escrow already exists for this deal",
  PAYMENT_DECLINED: "Payment was declined",
  PAYMENT_FAILED: "Payment processing failed",
  INSUFFICIENT_FUNDS: "Insufficient funds",
  INVALID_PAYMENT_METHOD: "Invalid payment method",
  ESCROW_ALREADY_RELEASED: "Escrow already released",
  ESCROW_ALREADY_REFUNDED: "Escrow already refunded",
  UNAUTHORIZED_ESCROW_ACTION: "Not authorized to perform this action",
  ESCROW_INVALID_STATUS: "Invalid escrow status for this operation",
  REFUND_FAILED: "Refund processing failed",
  REFUND_INVALID_AMOUNT: "Invalid refund amount",

  // Chat/Conversation Errors
  CONVERSATION_NOT_FOUND: "Conversation not found",
  MESSAGE_NOT_FOUND: "Message not found",
  MESSAGE_TOO_LONG: "Message exceeds maximum length",
  ATTACHMENT_TOO_LARGE: "Attachment size exceeds limit",
  TOO_MANY_ATTACHMENTS: "Too many attachments",
  NOT_CONVERSATION_PARTICIPANT:
    "User is not a participant in this conversation",
  INVALID_CONVERSATION_CONTEXT: "Invalid conversation context",
  CONFIRMATIONS_INCOMPLETE: "Both buyer and seller confirmations required",
  TRANSFER_FAILED: "Stripe transfer to seller failed",

  // Success messages
  BID_DELETED: "Bid deleted successfully",

  // Dynamic messages
  get: (module: string) => `${module} retrieved successfully`,
  created: (module: string) => `${module} created successfully`,
  updated: (module: string) => `${module} updated successfully`,
  deleted: (module: string) => `${module} deleted successfully`,
  notFound: (module: string) => `${module} not found`,
  marked: (module: string) => `${module} marked successfully`,
};

export const MODULES = {
  USER: "User",
  AD: "Ad",
  REQUIREMENT: "Requirement",
  BID: "Bid",
  NOTIFICATION: "Notification",
};

// REQUIREMENTS
export enum STATUS {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CLOSED = "CLOSED",
  FULFILLED = "FULFILLED",
  CANCELLED = "CANCELLED",
}

// DOAMONDS
export enum DIAMOND_TYPE {
  NATURAL = "Natural",
  LAB_GROWN = "Lab-Grown",
  SIMULATED = "Simulated",
}
export enum LAB_GROWN_TYPE {
  HPHT = "HPHT",
  CVD = "CVD",
  ANY = "Any",
}
export enum TREATMENT_STATUS {
  UNTREATED = "Untreated",
  TREATED = "Treated",
  ANY = "Any",
}
export enum TREATMENT_TYPE {
  HPHT = "HPHT",
  Laser_Drilled = "Laser Drilled",
  Fracture_Filled = "Fracture Filled",
  Irradiated = "Irradiated",
  Clarity_Enhanced = "Clarity Enhanced",
  Color_Enhanced = "Color Enhanced",
  Coating = "Coating",
  Annealing = "Annealing",
}

// CERTIFICATION LABS
export enum CERTIFICATION_LAB {
  GIA = "GIA", // Gemological Institute of America
  AGS = "AGS", // American Gem Society
  IGI = "IGI", // International Gemological Institute
  HRD = "HRD", // HRD Antwerp
  GCAL = "GCAL", // Gem Certification & Assurance Lab
  EGL_USA = "EGL USA",
  EGL_INTERNATIONAL = "EGL International",
  GSI = "GSI", // Gemological Science International
  NGTC = "NGTC", // National Gemstone Testing Center - China
  GRS = "GRS", // Gem Research Swisslab
  SSEF = "SSEF", // Swiss Gemmological Institute
  GUBELIN = "Gübelin",
  PGGL = "PGGL", // Professional Gem Laboratories
  AGL = "AGL", // American Gemological Laboratories
  CGL = "CGL", // Central Gem Laboratory - Japan
  IGL = "IGL", // Independent Gemological Laboratories
  GII = "GII", // Gemological Institute of India
  GJEPC = "GJEPC", // Gem & Jewellery Export Promotion Council
  IIDGR = "IIDGR", // International Institute of Diamond Grading
  DGLA = "DGLA", // Diamond Grading Lab of Australia
  DSEF = "DSEF", // German Gemstone Testing Lab
  GIT = "GIT", // Gem and Jewelry Institute of Thailand
  WITH_CLARITY = "With Clarity",
  RARE_CARAT = "Rare Carat",
}

// DIAMOND SHAPES
export enum DIAMOND_SHAPE {
  ROUND = "Round",
  PRINCESS = "Princess",
  EMERALD = "Emerald",
  OVAL = "Oval",
  ASSCHER = "Asscher",
  MARQUISE = "Marquise",
  PEAR = "Pear",
  RADIANT = "Radiant",
  CUSHION = "Cushion",
  HEART = "Heart",
  TRILLIANT = "Trilliant",
  BAGUETTE = "Baguette",
  TRIANGLE = "Triangle",
  ROSE_CUT = "Rose Cut",
  OLD_MINE_CUT = "Old Mine Cut",
  OLD_EUROPEAN_CUT = "Old European Cut",
  BRIOLETTE = "Briolette",
  KITE = "Kite",
  HALF_MOON = "Half Moon",
  SHIELD = "Shield",
  TRAPEZOID = "Trapezoid",
}

// CUT GRADES
export enum CUT_GRADE {
  IDEAL = "Ideal", // AGS only
  EXCELLENT = "Excellent",
  VERY_GOOD = "Very Good",
  GOOD = "Good",
  FAIR = "Fair",
  POOR = "Poor",
}

// POLISH & SYMMETRY
export enum POLISH_SYMMETRY {
  EXCELLENT = "Excellent",
  VERY_GOOD = "Very Good",
  GOOD = "Good",
  FAIR = "Fair",
  POOR = "Poor",
}

// GIRDLE THICKNESS
export enum GIRDLE_THICKNESS {
  EXTREMELY_THIN = "Extremely Thin",
  VERY_THIN = "Very Thin",
  THIN = "Thin",
  MEDIUM = "Medium",
  SLIGHTLY_THICK = "Slightly Thick",
  THICK = "Thick",
  VERY_THICK = "Very Thick",
  EXTREMELY_THICK = "Extremely Thick",
}

// CULET SIZE
export enum CULET_SIZE {
  NONE = "None",
  VERY_SMALL = "Very Small",
  SMALL = "Small",
  MEDIUM = "Medium",
  SLIGHTLY_LARGE = "Slightly Large",
  LARGE = "Large",
  VERY_LARGE = "Very Large",
}

// COLOR GRADES (Standard - D to Z)
export enum COLOR_GRADE {
  D = "D",
  E = "E",
  F = "F",
  G = "G",
  H = "H",
  I = "I",
  J = "J",
  K = "K",
  L = "L",
  M = "M",
  N = "N",
  O = "O",
  P = "P",
  Q = "Q",
  R = "R",
  S = "S",
  T = "T",
  U = "U",
  V = "V",
  W = "W",
  X = "X",
  Y = "Y",
  Z = "Z",
}

// FANCY COLOR INTENSITY
export enum FANCY_COLOR_INTENSITY {
  FAINT = "Faint",
  VERY_LIGHT = "Very Light",
  LIGHT = "Light",
  FANCY_LIGHT = "Fancy Light",
  FANCY = "Fancy",
  FANCY_INTENSE = "Fancy Intense",
  FANCY_VIVID = "Fancy Vivid",
  FANCY_DEEP = "Fancy Deep",
  FANCY_DARK = "Fancy Dark",
}

// FANCY COLOR HUE
export enum FANCY_COLOR_HUE {
  YELLOW = "Yellow",
  BROWN = "Brown",
  ORANGE = "Orange",
  PINK = "Pink",
  RED = "Red",
  PURPLE = "Purple",
  VIOLET = "Violet",
  BLUE = "Blue",
  GREEN = "Green",
  GRAY = "Gray",
  BLACK = "Black",
  WHITE = "White",
  CHAMELEON = "Chameleon",
}

// FANCY COLOR MODIFIER
export enum FANCY_COLOR_MODIFIER {
  NONE = "None",
  BROWNISH = "Brownish",
  GRAYISH = "Grayish",
  YELLOWISH = "Yellowish",
  ORANGY = "Orangy",
  PINKISH = "Pinkish",
  PURPLISH = "Purplish",
  BLUISH = "Bluish",
  GREENISH = "Greenish",
  REDDISH = "Reddish",
  VIOLETISH = "Violetish",
}

// CLARITY GRADES
export enum CLARITY_GRADE {
  FL = "FL", // Flawless
  IF = "IF", // Internally Flawless
  VVS1 = "VVS1", // Very Very Slightly Included 1
  VVS2 = "VVS2", // Very Very Slightly Included 2
  VS1 = "VS1", // Very Slightly Included 1
  VS2 = "VS2", // Very Slightly Included 2
  SI1 = "SI1", // Slightly Included 1
  SI2 = "SI2", // Slightly Included 2
  SI3 = "SI3", // Slightly Included 3 - EGL only
  I1 = "I1", // Included 1
  I2 = "I2", // Included 2
  I3 = "I3", // Included 3
}

// INCLUSION TYPES
export enum INCLUSION_TYPE {
  CRYSTAL = "Crystal",
  FEATHER = "Feather",
  CLOUD = "Cloud",
  NEEDLE = "Needle",
  PINPOINT = "Pinpoint",
  CAVITY = "Cavity",
  CHIP = "Chip",
  BRUISE = "Bruise",
  KNOT = "Knot",
  LASER_DRILL_HOLE = "Laser Drill Hole",
  BEARDING = "Bearding",
  ETCH_CHANNEL = "Etch Channel",
  TWINNING_WISP = "Twinning Wisp",
  INDENTED_NATURAL = "Indented Natural",
  SURFACE_GRAINING = "Surface Graining",
}

// FLUORESCENCE
export enum FLUORESCENCE {
  NONE = "None",
  FAINT = "Faint",
  MEDIUM = "Medium",
  STRONG = "Strong",
  VERY_STRONG = "Very Strong",
}

// FLUORESCENCE COLOR
export enum FLUORESCENCE_COLOR {
  BLUE = "Blue",
  YELLOW = "Yellow",
  WHITE = "White",
  ORANGE = "Orange",
  GREEN = "Green",
  RED = "Red",
}

// OPTICAL PROPERTIES
export enum OPTICAL_PROPERTY {
  EXCEPTIONAL = "Exceptional",
  EXCELLENT = "Excellent",
  VERY_GOOD = "Very Good",
  GOOD = "Good",
  FAIR = "Fair",
}

// CURRENCY
export enum CURRENCY {
  USD = "USD", // US Dollar
  EUR = "EUR", // Euro
  GBP = "GBP", // British Pound
  AUD = "AUD", // Australian Dollar
  CAD = "CAD", // Canadian Dollar
  INR = "INR", // Indian Rupee
  JPY = "JPY", // Japanese Yen
  CNY = "CNY", // Chinese Yuan
}

// SUSTAINABILITY PREFERENCE
export enum SUSTAINABILITY_PREFERENCE {
  LAB_GROWN_ONLY = "Lab-Grown Only",
  RECYCLED_DIAMONDS = "Recycled Diamonds",
  CANADIAN_ORIGIN = "Canadian Origin",
  FAIR_TRADE_CERTIFIED = "Fair Trade Certified",
  ANY = "Any",
}

// INTENDED USE
export enum INTENDED_USE {
  ENGAGEMENT_RING = "Engagement Ring",
  WEDDING_BAND = "Wedding Band",
  ANNIVERSARY = "Anniversary",
  EARRINGS = "Earrings",
  NECKLACE = "Necklace",
  BRACELET = "Bracelet",
  INVESTMENT = "Investment",
  GIFT = "Gift",
  COLLECTION = "Collection",
  RESALE = "Resale",
  OTHER = "Other",
}

// SETTING TYPE
export enum SETTING_TYPE {
  PRONG = "Prong",
  BEZEL = "Bezel",
  CHANNEL = "Channel",
  PAVE = "Pavé",
  TENSION = "Tension",
  HALO = "Halo",
  THREE_STONE = "Three Stone",
  SOLITAIRE = "Solitaire",
  CLUSTER = "Cluster",
  BAR = "Bar",
  INVISIBLE = "Invisible",
  NOT_APPLICABLE = "Not Applicable",
}

// METAL TYPE
export enum METAL_TYPE {
  PLATINUM = "Platinum",
  WHITE_GOLD = "White Gold",
  YELLOW_GOLD = "Yellow Gold",
  ROSE_GOLD = "Rose Gold",
  PALLADIUM = "Palladium",
  SILVER = "Silver",
  TITANIUM = "Titanium",
  TWO_TONE = "Two Tone",
}

// COLOR GRADING
export enum COLOR_TYPE {
  STANDARD = "Standard",
  FANCY = "Fancy",
}
export enum COLOR_ORIGIN {
  NATURAL = "Natural",
  TREATED = "Treated",
  ANY = "Any",
}
export enum COLOR_DISTRIBUTION {
  EVEN = "Even",
  UNEVEN = "Uneven",
  ANY = "Any",
}

// NOTIFICATIONS
export enum NOTIFICATION_TYPE {
  REQUIREMENT = "REQUIREMENT",
  BID = "BID",
  DEAL = "DEAL",
  CHAT = "CHAT",
  GENERAL = "GENERAL",
  SYSTEM = "SYSTEM",
}
export enum NOTIFICATION_CATEGORY {
  ACTIONABLE = "actionable",
  GENERAL = "general",
}
export enum NOTIFICATION_FREQUENCY {
  INSTANT = "Instant",
  HOURLY_DIGEST = "Hourly Digest",
  DAILY_DIGEST = "Daily Digest",
  WEEKLY_DIGEST = "Weekly Digest",
}

// PAYMENT & BID
export enum PAYMENT_METHOD {
  WIRE_TRANSFER = "Wire Transfer",
  CREDIT_CARD = "Credit Card",
  BANK_TRANSFER = "Bank Transfer",
  PAYPAL = "PayPal",
  CRYPTOCURRENCY = "Cryptocurrency",
  CHECK = "Check",
  CASH = "Cash",
}

export enum STOCK_STATUS {
  IN_STOCK = "In Stock",
  CAN_SOURCE = "Can Source",
  MADE_TO_ORDER = "Made to Order",
}

// DEAL STATUS
export enum DEAL_STATUS {
  DEAL_CREATED = "DEAL_CREATED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// BID STATUS
export enum BID_STATUS {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

// ESCROW STATUS
export enum ESCROW_STATUS {
  PENDING = "PENDING",
  HELD = "HELD",
  RELEASED = "RELEASED",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
  EXPIRED = "EXPIRED",
}

// ESCROW REFUND REASONS
export enum ESCROW_REFUND_REASON {
  DEAL_CANCELED = "DEAL_CANCELED",
  FRAUD_DETECTED = "FRAUD_DETECTED",
  MUTUAL_AGREEMENT = "MUTUAL_AGREEMENT",
  ITEM_NOT_AS_DESCRIBED = "ITEM_NOT_AS_DESCRIBED",
  OTHER = "OTHER",
}

// ESCROW CONFIRMATION TYPE
export enum ESCROW_CONFIRMATION_TYPE {
  BUYER_CONFIRMATION = "BUYER_CONFIRMATION",
  SELLER_CONFIRMATION = "SELLER_CONFIRMATION",
}

// ESCROW TIMELINE EVENTS
export enum ESCROW_EVENT {
  ESCROW_CREATED = "ESCROW_CREATED",
  PAYMENT_CAPTURED = "PAYMENT_CAPTURED",
  BUYER_CONFIRMED = "BUYER_CONFIRMED",
  SELLER_CONFIRMED = "SELLER_CONFIRMED",
  PAYMENT_RELEASED = "PAYMENT_RELEASED",
  PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
  TRANSFER_COMPLETED = "TRANSFER_COMPLETED",
  ESCROW_EXPIRED = "ESCROW_EXPIRED",
  DISPUTE_OPENED = "DISPUTE_OPENED",
}

// SECURITY ERROR MESSAGES
export const WEBHOOK_SIGNATURE_INVALID = "Invalid webhook signature";
export const RATE_LIMIT_EXCEEDED =
  "Rate limit exceeded. Please try again later";
export const INSECURE_CONNECTION = "HTTPS connection required";
export const INVALID_IDEMPOTENCY_KEY = "Invalid or duplicate idempotency key";

// INVENTORY CONSTANTS
export enum INVENTORY_STATUS {
  IN_LOCKER = "IN_LOCKER",
  ON_MEMO = "ON_MEMO",
  SOLD = "SOLD",
  IN_REPAIR = "IN_REPAIR",
  IN_TRANSIT = "IN_TRANSIT",
  RETURNED = "RETURNED",
  RESERVED = "RESERVED",
  PENDING_CERTIFICATION = "PENDING_CERTIFICATION",
}

export enum INVENTORY_CUT_GRADE {
  EXCELLENT = "EXCELLENT",
  VERY_GOOD = "VERY_GOOD",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
}

export enum INVENTORY_COLOR_GRADE {
  D = "D",
  E = "E",
  F = "F",
  G = "G",
  H = "H",
  I = "I",
  J = "J",
  K = "K",
  L = "L",
  M = "M",
}

export enum INVENTORY_CLARITY_GRADE {
  FL = "FL",
  IF = "IF",
  VVS1 = "VVS1",
  VVS2 = "VVS2",
  VS1 = "VS1",
  VS2 = "VS2",
  SI1 = "SI1",
  SI2 = "SI2",
  I1 = "I1",
}

export enum INVENTORY_SHAPE {
  ROUND = "ROUND",
  PRINCESS = "PRINCESS",
  CUSHION = "CUSHION",
  EMERALD = "EMERALD",
  OVAL = "OVAL",
  RADIANT = "RADIANT",
  ASSCHER = "ASSCHER",
  MARQUISE = "MARQUISE",
  HEART = "HEART",
  PEAR = "PEAR",
}

export enum INVENTORY_CERTIFICATE {
  GIA = "GIA",
  IGI = "IGI",
  AGS = "AGS",
  HRD = "HRD",
  EGL = "EGL",
  NONE = "NONE",
}

export enum INVENTORY_DELETION_REASON {
  DAMAGED = "DAMAGED",
  LOST = "LOST",
  STOLEN = "STOLEN",
  RETURNED_TO_SUPPLIER = "RETURNED_TO_SUPPLIER",
  OTHER = "OTHER",
}

// INVENTORY ERROR MESSAGES
export const INVENTORY_ERRORS = {
  // Validation Errors (400)
  VALIDATION_ERROR: "Validation failed",
  INVALID_CARAT: "Carat must be between 0.01 and 100",
  INVALID_CUT: "Cut must be one of: EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR",
  INVALID_COLOR: "Color must be one of: D, E, F, G, H, I, J, K, L, M",
  INVALID_CLARITY:
    "Clarity must be one of: FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1",
  INVALID_SHAPE: "Shape must be valid diamond shape",
  INVALID_CERTIFICATE:
    "Certificate must be one of: GIA, IGI, AGS, HRD, EGL, NONE",
  INVALID_PRICE: "Price must be positive",
  INVALID_CURRENCY: "Currency must be one of: USD, EUR, GBP, INR",
  INVALID_STATUS: "Invalid inventory status",
  INVALID_LOCATION: "Location is required and must not exceed 100 characters",
  PHOTOS_LIMIT_EXCEEDED: "Maximum 10 photos allowed",
  PHOTO_SIZE_EXCEEDED: "Photo size exceeds 5MB limit",
  NOTES_TOO_LONG: "Notes cannot exceed 1000 characters",
  INVALID_INVENTORY_ID: "Invalid inventory ID format",
  INVALID_BARCODE: "Invalid barcode format",

  // Authorization Errors (401, 403)
  INVENTORY_UNAUTHORIZED: "Not authorized to access this inventory item",
  INVENTORY_ACCESS_DENIED: "User does not own this inventory item",

  // Not Found Errors (404)
  INVENTORY_NOT_FOUND: "Inventory item not found",
  INVENTORY_DELETED: "Inventory item has been deleted",

  // Conflict Errors (409)
  DUPLICATE_CERTIFICATE_NUMBER: "Certificate number already exists",
  DUPLICATE_INVENTORY_ID: "Inventory ID already exists",
  DUPLICATE_BARCODE: "Barcode already exists",
  INVALID_STATUS_TRANSITION: "Invalid status transition",
  CANNOT_DELETE_SOLD: "Cannot delete sold item - part of transaction history",
  CANNOT_DELETE_ON_MEMO: "Cannot delete item on memo - must return first",
  CANNOT_UPDATE_SOLD: "Cannot update sold item",
  SOLD_REQUIRES_DETAILS: "soldAt and soldTo required when marking as SOLD",

  // Server Errors (500)
  BARCODE_GENERATION_FAILED: "Failed to generate barcode",
  INVENTORY_DATABASE_ERROR: "Database operation failed",
  INVENTORY_AUDIT_LOG_FAILED: "Failed to create audit log",
};

// BADGE TIERS
export enum BADGE_TIER {
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
  DIAMOND = "DIAMOND",
}

// REPUTATION LEVELS
export enum REPUTATION_LEVEL {
  POOR = "POOR",
  FAIR = "FAIR",
  GOOD = "GOOD",
  VERY_GOOD = "VERY_GOOD",
  EXCELLENT = "EXCELLENT",
}

// RATING CATEGORIES
export const RATING_CATEGORIES = {
  COMMUNICATION: "communication",
  PRODUCT_QUALITY: "productQuality",
  DELIVERY: "delivery",
  PRICING: "pricing",
  PROFESSIONALISM: "professionalism",
};

// RATING ERROR MESSAGES
export const RATING_ERRORS = {
  // Validation Errors (400)
  RATING_VALIDATION_ERROR: "Rating validation failed",
  INVALID_RATING_VALUE: "Rating must be between 1 and 5",
  INVALID_CATEGORY_RATING: "Category ratings must be between 1 and 5",
  REVIEW_TOO_SHORT: "Review must be at least 10 characters",
  REVIEW_TOO_LONG: "Review cannot exceed 1000 characters",
  MISSING_REQUIRED_FIELDS: "Missing required fields (dealId, rating)",

  // Authorization Errors (401, 403)
  NOT_DEAL_PARTICIPANT: "You are not a participant in this deal",
  CANNOT_RATE_SELF: "You cannot rate yourself",
  RATING_UNAUTHORIZED: "Not authorized to submit this rating",

  // Not Found Errors (404)
  DEAL_NOT_FOUND: "Deal not found",
  USER_NOT_FOUND: "User not found for rating",
  RATING_NOT_FOUND: "Rating not found",

  // Conflict Errors (409)
  RATING_ALREADY_EXISTS: "You have already rated this deal",
  DUPLICATE_RATING: "Duplicate rating not allowed",

  // Business Logic Errors (422)
  DEAL_NOT_COMPLETED: "Cannot rate incomplete deal",
  DEAL_STATUS_INVALID: "Deal must be completed to submit rating",

  // Server Errors (500)
  RATING_DATABASE_ERROR: "Failed to save rating",
  BADGE_CALCULATION_ERROR: "Failed to calculate badge progress",
  REPUTATION_UPDATE_ERROR: "Failed to update reputation score",
  NOTIFICATION_SEND_ERROR: "Failed to send rating notification",

  // Security Errors (429, 403)
  RATE_LIMIT_EXCEEDED: "Rating limit exceeded. Maximum 5 ratings per day",
  HOURLY_LIMIT_EXCEEDED: "Too many ratings. Please try again later",
  SUSPECTED_ABUSE: "Rating flagged for review",
  REVIEW_CONTAINS_PROFANITY: "Review contains inappropriate language",
};

// RATE LIMITING CONSTANTS
export const RATE_LIMITS = {
  MAX_RATINGS_PER_DAY: 5,
  MAX_RATINGS_PER_HOUR: 3,
  MAX_REPORTS_PER_DAY: 10,
};

// ABUSE REPORT REASONS
export const ABUSE_REASONS = {
  SPAM: "Spam or irrelevant content",
  PROFANITY: "Contains profanity or offensive language",
  HARASSMENT: "Harassment or bullying",
  FALSE_INFORMATION: "Contains false or misleading information",
  OFF_TOPIC: "Off-topic or not related to the deal",
  OTHER: "Other reason",
};

// PROFANITY DETECTION (basic list - can be expanded)
export const PROFANITY_LIST = [
  "spam",
  "scam",
  "fake",
  "fraud",
  // Add more words as needed
];

// BADGE IDs
export const BADGE_IDS = {
  // Deal-Based Badges
  FIRST_DEAL: "FIRST_DEAL",
  DEAL_MAKER: "DEAL_MAKER",
  DEAL_MASTER: "DEAL_MASTER",
  DEAL_LEGEND: "DEAL_LEGEND",

  // Rating-Based Badges
  HIGHLY_RATED: "HIGHLY_RATED",
  TOP_RATED: "TOP_RATED",

  // Volume-Based Badges
  SMALL_TRADER: "SMALL_TRADER",
  MEDIUM_TRADER: "MEDIUM_TRADER",
  HIGH_VOLUME: "HIGH_VOLUME",
  ELITE_TRADER: "ELITE_TRADER",

  // Activity-Based Badges
  ACTIVE_MEMBER: "ACTIVE_MEMBER",
  POWER_USER: "POWER_USER",
  SUPER_USER: "SUPER_USER",

  // Special Badges
  VERIFIED_BUSINESS: "VERIFIED_BUSINESS",
  FAST_RESPONDER: "FAST_RESPONDER",
  RELIABLE_SHIPPER: "RELIABLE_SHIPPER",
};
