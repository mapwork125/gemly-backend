import QRCode from "qrcode";
import bwipjs from "bwip-js";
import Inventory from "../models/Inventory.model";

/**
 * Generate unique inventory ID in format INV-YYYY-XXXXX
 */
export async function generateInventoryId(): Promise<string> {
  const year = new Date().getFullYear();

  // Find the last inventory item for this year
  const lastItem = await Inventory.findOne({
    inventoryId: new RegExp(`^INV-${year}-`),
  }).sort({ createdAt: -1 });

  let nextNumber = 1;
  if (lastItem && lastItem.inventoryId) {
    const lastNumber = parseInt(lastItem.inventoryId.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  return `INV-${year}-${String(nextNumber).padStart(5, "0")}`;
}

/**
 * Generate barcode image from text using Code128
 * @param text - Text to encode (e.g., "INV202400001")
 * @param type - Barcode type (default: code128)
 * @returns Base64 encoded PNG image
 */
export async function generateBarcode(
  text: string,
  type: string = "code128"
): Promise<string> {
  try {
    // Remove hyphens from inventory ID for cleaner barcode
    const cleanText = text.replace(/-/g, "");

    const png = await bwipjs.toBuffer({
      bcid: type, // Barcode type
      text: cleanText, // Text to encode
      scale: 3, // Scaling factor
      height: 10, // Bar height in mm
      includetext: true, // Show human-readable text
      textxalign: "center", // Center text
      textsize: 13, // Font size
    });

    // Convert buffer to base64
    const base64 = `data:image/png;base64,${png.toString("base64")}`;
    return base64;
  } catch (error) {
    console.error("Barcode generation error:", error);
    throw new Error("Failed to generate barcode");
  }
}

/**
 * Generate a QR code for the given text (mobile scanning)
 * @param text - The text to encode in the QR code.
 * @returns A promise that resolves to the QR code as a data URL.
 */
export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 2,
    });
    return qrCodeDataUrl; // Returns the QR code as a base64 data URL
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

/**
 * Validate barcode text format
 */
export function validateBarcodeText(text: string): boolean {
  // Check if text is alphanumeric and reasonable length
  return /^[A-Z0-9]{5,20}$/.test(text);
}
