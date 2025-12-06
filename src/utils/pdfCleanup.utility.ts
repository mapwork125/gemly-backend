import Deal from "../models/Deal.model";
import fs from "fs";
import path from "path";

/**
 * Clean up expired PDF files from the filesystem and database
 * This should be run periodically (e.g., daily via cron job or scheduler)
 */
export const cleanupExpiredPDFs = async () => {
  try {
    console.log("Starting PDF cleanup process...");

    // Find all deals with expired PDFs
    const expiredDeals = await Deal.find({
      pdfExpiryTime: { $lt: new Date() },
      pdfFilePath: { $exists: true, $ne: null },
    }).select("_id pdfFilePath pdfUrl pdfExpiryTime");

    if (expiredDeals.length === 0) {
      console.log("No expired PDFs found.");
      return { deleted: 0, failed: 0 };
    }

    console.log(`Found ${expiredDeals.length} expired PDFs to delete.`);

    let deletedCount = 0;
    let failedCount = 0;

    for (const deal of expiredDeals) {
      try {
        // Delete file from filesystem if it exists
        if (deal.pdfFilePath && fs.existsSync(deal.pdfFilePath)) {
          fs.unlinkSync(deal.pdfFilePath);
          console.log(`Deleted PDF file: ${deal.pdfFilePath}`);
        }

        // Update database to remove PDF references
        await Deal.findByIdAndUpdate(deal._id, {
          $unset: {
            pdfUrl: "",
            pdfFilePath: "",
            pdfExpiryTime: "",
          },
        });

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete PDF for deal ${deal._id}:`, error);
        failedCount++;
      }
    }

    console.log(
      `PDF cleanup completed. Deleted: ${deletedCount}, Failed: ${failedCount}`
    );

    return { deleted: deletedCount, failed: failedCount };
  } catch (error) {
    console.error("Error during PDF cleanup:", error);
    throw error;
  }
};

/**
 * Clean up all PDFs in the uploads/pdfs directory that are older than specified days
 * This is a safety mechanism to clean orphaned files
 * @param daysOld - Delete files older than this many days (default: 7)
 */
export const cleanupOrphanedPDFs = async (daysOld: number = 7) => {
  try {
    console.log(
      `Starting orphaned PDF cleanup (older than ${daysOld} days)...`
    );

    const pdfDir = path.join(process.cwd(), "src", "uploads", "pdfs");

    if (!fs.existsSync(pdfDir)) {
      console.log("PDF directory does not exist. Nothing to clean.");
      return { deleted: 0 };
    }

    const files = fs.readdirSync(pdfDir);
    let deletedCount = 0;

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.endsWith(".pdf")) continue;

      const filePath = path.join(pdfDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoffTime) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted orphaned PDF: ${file}`);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete orphaned PDF ${file}:`, error);
        }
      }
    }

    console.log(
      `Orphaned PDF cleanup completed. Deleted: ${deletedCount} files.`
    );
    return { deleted: deletedCount };
  } catch (error) {
    console.error("Error during orphaned PDF cleanup:", error);
    throw error;
  }
};

/**
 * Manually delete a specific deal's PDF
 * @param dealId - ID of the deal whose PDF should be deleted
 */
export const deleteDealPDF = async (dealId: string) => {
  try {
    const deal: any = await Deal.findById(dealId).select("pdfFilePath");

    if (!deal) {
      throw new Error("Deal not found");
    }

    if (!deal.pdfFilePath) {
      console.log(`No PDF file path found for deal ${dealId}`);
      return { deleted: false, reason: "No PDF file path" };
    }

    // Delete file from filesystem
    if (fs.existsSync(deal.pdfFilePath)) {
      fs.unlinkSync(deal.pdfFilePath);
      console.log(`Deleted PDF file: ${deal.pdfFilePath}`);
    }

    // Update database
    await Deal.findByIdAndUpdate(dealId, {
      $unset: {
        pdfUrl: "",
        pdfFilePath: "",
        pdfExpiryTime: "",
      },
    });

    console.log(`PDF deleted successfully for deal ${dealId}`);
    return { deleted: true };
  } catch (error) {
    console.error(`Failed to delete PDF for deal ${dealId}:`, error);
    throw error;
  }
};

/**
 * Get statistics about PDF storage
 */
export const getPDFStats = async () => {
  try {
    const totalDeals = await Deal.countDocuments({
      pdfFilePath: { $exists: true, $ne: null },
    });
    const expiredDeals = await Deal.countDocuments({
      pdfExpiryTime: { $lt: new Date() },
      pdfFilePath: { $exists: true, $ne: null },
    });
    const activeDeals = totalDeals - expiredDeals;

    const pdfDir = path.join(process.cwd(), "src", "uploads", "pdfs");
    let totalFiles = 0;
    let totalSize = 0;

    if (fs.existsSync(pdfDir)) {
      const files = fs.readdirSync(pdfDir);
      for (const file of files) {
        if (file.endsWith(".pdf")) {
          totalFiles++;
          const filePath = path.join(pdfDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        }
      }
    }

    return {
      dealsWithPDF: totalDeals,
      activePDFs: activeDeals,
      expiredPDFs: expiredDeals,
      filesOnDisk: totalFiles,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error("Error getting PDF stats:", error);
    throw error;
  }
};
