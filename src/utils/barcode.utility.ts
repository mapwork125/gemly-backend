import QRCode from "qrcode";
import fs from "fs";
import path from "path";
/**
 * Generate a QR code for the given text.
 * @param text - The text to encode in the QR code.
 * @returns A promise that resolves to the QR code as a data URL.
 */
export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text);
    return qrCodeDataUrl; // Returns the QR code as a base64 data URL
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};
/**
 * Generate a QR code and save it as an image in the uploads folder.
 * @param data - The data to encode in the QR code.
 * @returns The URL of the saved QR code image.
 */
export const generateBarcode = async (
  data: string = "https://youtube.com"
): Promise<string> => {
  try {
    // Generate the QR code as a base64 data URL
    const qrCodeDataUrl = await generateQRCode(data);

    // Decode the base64 data URL to binary data
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const fileName = `qr-code-${Date.now()}.png`;
    const filePath = path.join(__dirname, "../uploads", fileName);

    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Write the binary data to a file
    fs.writeFileSync(filePath, base64Data, "base64");

    // Return the URL of the saved QR code image
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Error generating barcode:", error);
    throw new Error("Failed to generate barcode");
  }
};
