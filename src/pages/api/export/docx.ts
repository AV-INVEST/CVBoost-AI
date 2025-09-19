import { NextApiRequest, NextApiResponse } from "next";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { score, missingKeywords, suggestions, improvedResume, coverLetter } = req.body;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "CVBoost.ai — Report ATS", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Punteggio Match: ${score}/100` }),
            new Paragraph({ text: " " }),

            new Paragraph({ text: "Keyword mancanti:" }),
            ...missingKeywords.map((k: string) => new Paragraph({ text: "- " + k })),
            new Paragraph({ text: " " }),

            new Paragraph({ text: "Suggerimenti:" }),
            ...suggestions.map((s: string) => new Paragraph({ text: "- " + s })),
            new Paragraph({ text: " " }),

            new Paragraph({ text: "CV Riscritto:" }),
            new Paragraph({ text: improvedResume }),
            new Paragraph({ text: " " }),

            new Paragraph({ text: "Cover Letter:" }),
            new Paragraph({ text: coverLetter }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=cvboost-report.docx");
    res.send(buffer);
  } catch (err) {
    console.error("DOCX export error:", err);
    res.status(500).json({ error: "Failed to generate DOCX" });
  }
}
