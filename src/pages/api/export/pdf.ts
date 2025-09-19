import { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { score, missingKeywords, suggestions, improvedResume, coverLetter } = req.body;

    const doc = new PDFDocument();
    let buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=cvboost-report.pdf");
      res.send(pdfData);
    });

    doc.fontSize(20).text("CVBoost.ai — Report ATS", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Punteggio Match: ${score}/100`);
    doc.moveDown();

    doc.text("Keyword mancanti:");
    missingKeywords.forEach((k: string) => doc.text("- " + k));
    doc.moveDown();

    doc.text("Suggerimenti:");
    suggestions.forEach((s: string) => doc.text("- " + s));
    doc.moveDown();

    doc.text("CV Riscritto:");
    doc.text(improvedResume);
    doc.moveDown();

    doc.text("Cover Letter:");
    doc.text(coverLetter);

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}
