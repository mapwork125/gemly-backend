import { Router } from "express";
import * as Auth from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
} from "./auth.validation";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage to process files in memory
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
    }
  },
});

// Middleware to compress images larger than 5MB
const compressImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Check if the file is an image and larger than 5MB
    if (
      req.file.size > 5 * 1024 * 1024 &&
      req.file.mimetype.startsWith("image/")
    ) {
      const compressedBuffer = await sharp(req.file.buffer)
        .resize({ width: 1920 }) // Resize the image to a max width of 1920px
        .jpeg({ quality: 80 }) // Compress the image with 80% quality
        .toBuffer();

      // Replace the original file buffer with the compressed buffer
      req.file.buffer = compressedBuffer;
      req.file.size = compressedBuffer.length;
      req.file.mimetype = "image/jpeg"; // Ensure the mimetype is updated
    }

    next();
  } catch (error) {
    console.error("Error compressing image:", error);
    return res
      .status(500)
      .json({ status: false, message: "Failed to process image" });
  }
};

// Middleware to save the file to disk
const saveFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const uploadPath = path.join(__dirname, "../../uploads/identity");
    const uniqueName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadPath, uniqueName);

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Save the file to disk
    fs.writeFileSync(filePath, req.file.buffer);

    // Attach the file path to the request object
    req.file.path = `/uploads/identity/${uniqueName}`;
    next();
  } catch (error) {
    console.error("Error saving file:", error);
    return res
      .status(500)
      .json({ status: false, message: "Failed to save file" });
  }
};
router.post("/register", validate(registerSchema), Auth.register);
router.post("/login", validate(loginSchema), Auth.login);
router.post(
  "/verify-identity",
  authMiddleware,
  upload.single("document"),
  compressImage, // Compress the image if necessary
  saveFile, // Save the file to disk
  Auth.verifyIdentity
);
router.get("/profile", authMiddleware, Auth.getProfile);
router.put(
  "/profile",
  authMiddleware,
  validate(profileUpdateSchema),
  Auth.updateProfile
);
router.post("/logout", authMiddleware, Auth.logout);

export default router;
