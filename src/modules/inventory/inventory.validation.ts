import Joi from "joi";
import {
  CURRENCY,
  INVENTORY_STATUS,
  INVENTORY_CUT_GRADE,
  INVENTORY_COLOR_GRADE,
  INVENTORY_CLARITY_GRADE,
  INVENTORY_SHAPE,
  INVENTORY_CERTIFICATE,
  INVENTORY_DELETION_REASON,
} from "../../utils/constants.utility";

// Diamond details validation
const diamondDetailsSchema = Joi.object({
  carat: Joi.number().min(0.01).max(100).required().messages({
    "number.min": "Carat must be at least 0.01",
    "number.max": "Carat cannot exceed 100",
    "any.required": "Carat is required",
  }),
  cut: Joi.string()
    .valid(...Object.values(INVENTORY_CUT_GRADE))
    .required()
    .messages({
      "any.only": "Cut must be one of: EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR",
      "any.required": "Cut is required",
    }),
  color: Joi.string()
    .valid(...Object.values(INVENTORY_COLOR_GRADE))
    .required()
    .messages({
      "any.only": "Color must be one of: D, E, F, G, H, I, J, K, L, M",
      "any.required": "Color is required",
    }),
  clarity: Joi.string()
    .valid(...Object.values(INVENTORY_CLARITY_GRADE))
    .required()
    .messages({
      "any.only":
        "Clarity must be one of: FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1",
      "any.required": "Clarity is required",
    }),
  shape: Joi.string()
    .valid(...Object.values(INVENTORY_SHAPE))
    .required()
    .messages({
      "any.only":
        "Shape must be one of: ROUND, PRINCESS, CUSHION, EMERALD, OVAL, RADIANT, ASSCHER, MARQUISE, HEART, PEAR",
      "any.required": "Shape is required",
    }),
  certificate: Joi.string()
    .valid(...Object.values(INVENTORY_CERTIFICATE))
    .required()
    .messages({
      "any.only": "Certificate must be one of: GIA, IGI, AGS, HRD, EGL, NONE",
      "any.required": "Certificate is required",
    }),
  certificateNumber: Joi.string().max(50).optional().allow("").messages({
    "string.max": "Certificate number cannot exceed 50 characters",
  }),
});

// Pricing validation
const pricingSchema = Joi.object({
  costPrice: Joi.number().min(0).required().messages({
    "number.min": "Cost price must be positive",
    "any.required": "Cost price is required",
  }),
  sellingPrice: Joi.number().min(0).required().messages({
    "number.min": "Selling price must be positive",
    "any.required": "Selling price is required",
  }),
  currency: Joi.string()
    .valid(...Object.values(CURRENCY))
    .default("USD")
    .messages({
      "any.only": "Currency must be one of: USD, EUR, GBP, INR",
    }),
});

// Main inventory schema
export const inventorySchema = Joi.object({
  diamondDetails: diamondDetailsSchema.required().messages({
    "any.required": "Diamond details are required",
  }),
  pricing: pricingSchema.required().messages({
    "any.required": "Pricing information is required",
  }),
  location: Joi.string().max(100).required().messages({
    "string.max": "Location cannot exceed 100 characters",
    "any.required": "Location is required",
  }),
  status: Joi.string()
    .valid(...Object.values(INVENTORY_STATUS))
    .default("IN_LOCKER")
    .messages({
      "any.only":
        "Status must be one of: IN_LOCKER, ON_MEMO, SOLD, IN_REPAIR, IN_TRANSIT, RETURNED, RESERVED, PENDING_CERTIFICATION",
    }),
  photos: Joi.array().items(Joi.string()).max(10).optional().messages({
    "array.max": "Maximum 10 photos allowed",
  }),
  notes: Joi.string().max(1000).optional().allow("").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),

  // Legacy fields (optional for backward compatibility)
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  quantity: Joi.number().optional(),
  price: Joi.number().optional(),
  sku: Joi.string().optional(),
});

// Update schema (all fields optional)
export const updateInventorySchema = Joi.object({
  diamondDetails: Joi.object({
    carat: Joi.number().min(0.01).max(100).optional(),
    cut: Joi.string()
      .valid(...Object.values(INVENTORY_CUT_GRADE))
      .optional(),
    color: Joi.string()
      .valid(...Object.values(INVENTORY_COLOR_GRADE))
      .optional(),
    clarity: Joi.string()
      .valid(...Object.values(INVENTORY_CLARITY_GRADE))
      .optional(),
    shape: Joi.string()
      .valid(...Object.values(INVENTORY_SHAPE))
      .optional(),
    certificate: Joi.string()
      .valid(...Object.values(INVENTORY_CERTIFICATE))
      .optional(),
    certificateNumber: Joi.string().max(50).optional().allow(""),
  }).optional(),
  pricing: Joi.object({
    costPrice: Joi.number().min(0).optional(),
    sellingPrice: Joi.number().min(0).optional(),
    currency: Joi.string()
      .valid(...Object.values(CURRENCY))
      .optional(),
  }).optional(),
  location: Joi.string().max(100).optional(),
  status: Joi.string()
    .valid(...Object.values(INVENTORY_STATUS))
    .optional(),
  photos: Joi.array().items(Joi.string()).max(10).optional(),
  notes: Joi.string().max(1000).optional().allow(""),
  soldAt: Joi.date().optional(),
  soldTo: Joi.string().optional(),

  // Legacy fields
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  quantity: Joi.number().optional(),
  price: Joi.number().optional(),
  sku: Joi.string().optional(),
});

// Query parameters validation
export const inventoryQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1).messages({
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().min(1).max(100).default(50).messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
  status: Joi.string()
    .valid(...Object.values(INVENTORY_STATUS))
    .optional(),
  minCarat: Joi.number().min(0).optional(),
  maxCarat: Joi.number().min(0).optional(),
  color: Joi.string().optional(), // Comma-separated values
  cut: Joi.string().optional(), // Comma-separated values
  clarity: Joi.string().optional(), // Comma-separated values
  shape: Joi.string().optional(), // Comma-separated values
  search: Joi.string().min(3).optional().messages({
    "string.min": "Search query must be at least 3 characters",
  }),
  sortBy: Joi.string()
    .valid("createdAt", "carat", "costPrice", "sellingPrice", "updatedAt")
    .default("createdAt")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
});

// Delete validation
export const deleteInventorySchema = Joi.object({
  reason: Joi.string()
    .valid(...Object.values(INVENTORY_DELETION_REASON))
    .optional()
    .messages({
      "any.only":
        "Reason must be one of: DAMAGED, LOST, STOLEN, RETURNED_TO_SUPPLIER, OTHER",
    }),
  notes: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Deletion notes cannot exceed 500 characters",
  }),
});

// Quick status update validation (for mobile barcode scanning)
export const quickStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(INVENTORY_STATUS))
    .required()
    .messages({
      "any.required": "Status is required",
    }),
  location: Joi.string().max(100).optional().messages({
    "string.max": "Location cannot exceed 100 characters",
  }),
});

// ID parameter validation
export const inventoryIdSchema = Joi.object({
  id: Joi.alternatives()
    .try(
      Joi.string().hex().length(24), // MongoDB ObjectId
      Joi.string().pattern(/^INV-\d{4}-\d{5}$/) // Inventory ID format
    )
    .required()
    .messages({
      "alternatives.match":
        "ID must be a valid MongoDB ObjectId or Inventory ID (INV-YYYY-XXXXX)",
      "any.required": "ID is required",
    }),
});
