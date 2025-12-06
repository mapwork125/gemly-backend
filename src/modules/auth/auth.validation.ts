import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@#$%^&+=!]{8,}$")
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long, include 1 uppercase letter, 1 lowercase letter, and 1 number",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Confirm Password must match Password",
    "any.required": "Confirm Password is required",
  }),
  userType: Joi.string().valid("buyer", "seller").required().messages({
    "any.only": "User Type must be either 'buyer' or 'seller'",
    "any.required": "User Type is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const profileUpdateSchema = Joi.object({
  phoneNumber: Joi.string().optional(),
  companyAddress: Joi.object({
    line1: Joi.string().required(),
    line2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
  }).optional(),
  diamondIndustryActivity: Joi.string().max(300).optional(),
});

export const verifyIdentitySchema = Joi.object({
  fullName: Joi.string().min(3).required(),

  dateOfBirth: Joi.date().required(),

  phoneNumber: Joi.string().required(),

  identityProof: Joi.object({
    proofType: Joi.string().valid("Aadhar", "PAN").required(),
    proofNumber: Joi.string().required(),
  }).required(),

  documents: Joi.object({
    document: Joi.string().optional(),
    panDocument: Joi.string().optional(),
  }).optional(),

  companyDetails: Joi.object({
    companyName: Joi.string().required(),
    companyRegistrationNumber: Joi.string().optional(),

    companyAddress: Joi.object({
      line1: Joi.string().required(),
      line2: Joi.string().optional(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
    }).required(),

    companyCountry: Joi.string().required(),
  }).required(),

  businessType: Joi.string().required(),

  diamondIndustryActivity: Joi.string().max(300).required(),

  isAuthorizedPerson: Joi.boolean().default(true),
});
