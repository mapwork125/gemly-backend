import PDFDocument from "pdfkit";
import { IDeal } from "../models/Deal.model";

interface DealPDFData {
  deal: any;
  buyer: any;
  seller: any;
  requirement: any;
  bid: any;
}

/**
 * Generate a PDF agreement document for a deal
 * @param dealData - Complete deal data including all snapshots
 * @returns Buffer containing the PDF document
 */
export const generateDealPDF = async (
  dealData: DealPDFData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // HEADER
      doc.fontSize(20).font("Helvetica-Bold").text("DIAMOND DEAL AGREEMENT", {
        align: "center",
      });
      doc.moveDown();

      // DEAL ID & DATE
      doc.fontSize(10).font("Helvetica");
      doc.text(`Deal ID: ${dealData.deal._id}`, { align: "right" });
      doc.text(`Date: ${new Date(dealData.deal.createdAt).toLocaleString()}`, {
        align: "right",
      });
      doc.text(`Status: ${dealData.deal.status}`, { align: "right" });
      doc.moveDown(2);

      // PARTIES SECTION
      doc.fontSize(14).font("Helvetica-Bold").text("PARTIES TO THE AGREEMENT");
      doc.moveDown(0.5);

      // Buyer Details
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("BUYER (Requirement Owner):");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${dealData.buyer.name}`);
      doc.text(`Email: ${dealData.buyer.email}`);
      doc.text(`User ID: ${dealData.buyer._id}`);
      doc.text(`Verified: ${dealData.buyer.verified ? "Yes" : "No"}`);
      if (dealData.buyer.rating) {
        doc.text(`Rating: ${dealData.buyer.rating}/5`);
      }
      doc.moveDown();

      // Seller Details
      doc.fontSize(12).font("Helvetica-Bold").text("SELLER (Bidder):");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${dealData.seller.name}`);
      doc.text(`Email: ${dealData.seller.email}`);
      doc.text(`User ID: ${dealData.seller._id}`);
      doc.text(`Verified: ${dealData.seller.verified ? "Yes" : "No"}`);
      if (dealData.seller.rating) {
        doc.text(`Rating: ${dealData.seller.rating}/5`);
      }
      doc.moveDown(2);

      // FINANCIAL TERMS
      doc.fontSize(14).font("Helvetica-Bold").text("AGREED FINANCIAL TERMS");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(
        `Final Agreed Price: ${dealData.deal.agreedPrice} ${dealData.deal.currency}`
      );
      doc.text(`Currency: ${dealData.deal.currency}`);
      if (dealData.deal.bidSnapshot?.pricePerCarat) {
        doc.text(
          `Price per Carat: ${dealData.deal.bidSnapshot.pricePerCarat} ${dealData.deal.currency}`
        );
      }
      doc.moveDown(2);

      // REQUIREMENT SNAPSHOT
      doc.fontSize(14).font("Helvetica-Bold").text("BUYER REQUIREMENT");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const reqSnap = dealData.deal.requirementSnapshot || {};
      doc.text(`Title: ${reqSnap.title || "N/A"}`);
      doc.text(`Description: ${reqSnap.description || "N/A"}`, {
        width: 500,
      });
      if (reqSnap.startDate) {
        doc.text(
          `Start Date: ${new Date(reqSnap.startDate).toLocaleDateString()}`
        );
      }
      if (reqSnap.endDate) {
        doc.text(`End Date: ${new Date(reqSnap.endDate).toLocaleDateString()}`);
      }
      doc.moveDown(2);

      // DIAMOND SPECIFICATIONS
      doc.fontSize(14).font("Helvetica-Bold").text("DIAMOND SPECIFICATIONS");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const diamondSnap = dealData.deal.diamondSnapshot || {};

      if (diamondSnap.diamondType) doc.text(`Type: ${diamondSnap.diamondType}`);
      if (diamondSnap.caratWeight)
        doc.text(`Carat Weight: ${diamondSnap.caratWeight}`);
      if (diamondSnap.shape) doc.text(`Shape: ${diamondSnap.shape}`);
      if (diamondSnap.cutGrade) doc.text(`Cut Grade: ${diamondSnap.cutGrade}`);
      if (diamondSnap.colorGrade)
        doc.text(`Color Grade: ${diamondSnap.colorGrade}`);
      if (diamondSnap.clarityGrade)
        doc.text(`Clarity Grade: ${diamondSnap.clarityGrade}`);
      if (diamondSnap.certificateLab)
        doc.text(`Certificate Lab: ${diamondSnap.certificateLab}`);
      if (diamondSnap.certificateNumber)
        doc.text(`Certificate Number: ${diamondSnap.certificateNumber}`);
      if (diamondSnap.polish) doc.text(`Polish: ${diamondSnap.polish}`);
      if (diamondSnap.symmetry) doc.text(`Symmetry: ${diamondSnap.symmetry}`);
      if (diamondSnap.fluorescence)
        doc.text(`Fluorescence: ${diamondSnap.fluorescence}`);
      if (diamondSnap.measurements)
        doc.text(`Measurements: ${diamondSnap.measurements}`);
      doc.moveDown(2);

      // BID TERMS
      doc.fontSize(14).font("Helvetica-Bold").text("BID TERMS & CONDITIONS");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const bidSnap = dealData.deal.bidSnapshot || {};

      if (bidSnap.deliveryDays)
        doc.text(`Delivery Timeline: ${bidSnap.deliveryDays} days`);
      if (bidSnap.paymentTerms)
        doc.text(`Payment Terms: ${bidSnap.paymentTerms}`, { width: 500 });
      if (
        bidSnap.acceptedPaymentMethods &&
        bidSnap.acceptedPaymentMethods.length > 0
      ) {
        doc.text(
          `Accepted Payment Methods: ${bidSnap.acceptedPaymentMethods.join(
            ", "
          )}`
        );
      }
      if (bidSnap.stockStatus) doc.text(`Stock Status: ${bidSnap.stockStatus}`);
      doc.moveDown();

      // Seller Contact Information
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Seller Contact Information:");
      doc.fontSize(10).font("Helvetica");
      if (bidSnap.companyName) doc.text(`Company: ${bidSnap.companyName}`);
      if (bidSnap.contactPerson)
        doc.text(`Contact Person: ${bidSnap.contactPerson}`);
      if (bidSnap.contactEmail) doc.text(`Email: ${bidSnap.contactEmail}`);
      if (bidSnap.contactPhone) doc.text(`Phone: ${bidSnap.contactPhone}`);
      if (bidSnap.businessAddress) {
        const addr = bidSnap.businessAddress;
        doc.text(
          `Address: ${addr.street || ""}, ${addr.city || ""}, ${
            addr.state || ""
          }, ${addr.country || ""}, ${addr.postalCode || ""}`
        );
      }
      doc.moveDown(2);

      // POLICIES
      doc.fontSize(14).font("Helvetica-Bold").text("POLICIES & GUARANTEES");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      if (bidSnap.returnPolicy) {
        doc.text(`Return Policy: ${bidSnap.returnPolicy}`, { width: 500 });
      }
      if (bidSnap.warranty) {
        doc.text(`Warranty: ${bidSnap.warranty}`, { width: 500 });
      }
      doc.moveDown(2);

      // LEGAL DISCLAIMER
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("LEGAL DISCLAIMER");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");
      doc.text(
        "This agreement is generated electronically through the Diamond Trading Platform. " +
          "By accepting this deal, both parties agree to be bound by the terms and conditions outlined herein. " +
          "All information provided is deemed accurate as of the date of this agreement. " +
          "Any disputes arising from this transaction shall be resolved through the platform's dispute resolution mechanism. " +
          "The platform acts as a facilitator and is not responsible for the actual delivery, quality, or authenticity of the diamond. " +
          "Both parties are advised to conduct their own due diligence and verification. " +
          "This agreement is subject to the laws and regulations applicable in the jurisdiction of the transaction. " +
          "All snapshots of diamond specifications, requirement details, and bid terms are immutable and represent the agreed-upon conditions at the time of deal creation.",
        { width: 500, align: "justify" }
      );
      doc.moveDown(2);

      // SIGNATURES SECTION
      doc.fontSize(12).font("Helvetica-Bold").text("DIGITAL ACCEPTANCE");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Buyer: ${dealData.buyer.name}`);
      doc.text(
        `Accepted on: ${new Date(dealData.deal.createdAt).toLocaleString()}`
      );
      doc.moveDown();
      doc.text(`Seller: ${dealData.seller.name}`);
      doc.text(
        `Bid placed on: ${new Date(dealData.bid.createdAt).toLocaleString()}`
      );
      doc.moveDown(2);

      // FOOTER
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "This is a computer-generated document. No signature is required for validity.",
          { align: "center" }
        );
      doc.text(`Generated on: ${new Date().toLocaleString()}`, {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format deal data for PDF generation
 * @param deal - Deal document from database (populated)
 * @returns Formatted deal data
 */
export const formatDealForPDF = (deal: any): DealPDFData => {
  return {
    deal: {
      _id: deal._id,
      status: deal.status,
      agreedPrice: deal.agreedPrice,
      currency: deal.currency,
      diamondSnapshot: deal.diamondSnapshot,
      requirementSnapshot: deal.requirementSnapshot,
      bidSnapshot: deal.bidSnapshot,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    },
    buyer: deal.buyer,
    seller: deal.seller,
    requirement: deal.requirement,
    bid: deal.bid,
  };
};
