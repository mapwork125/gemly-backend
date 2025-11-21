import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export const generateDealPDFBuffer = async (deal) => {
  const doc = new PDFDocument();
  const chunks: any[] = [];
  doc.on('data', (c:any) => chunks.push(c));
  doc.on('end', () => {});
  doc.text('Deal Summary');
  doc.text(JSON.stringify(deal, null, 2));
  doc.end();
  await new Promise((res) => doc.on('end', res));
  return Buffer.concat(chunks);
};
