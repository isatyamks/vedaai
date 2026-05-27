import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { IAssignment } from '../models/Assignment';

const PALETTE = {
  ink: '#1a1a1a',
  mid: '#475569',
  muted: '#64748b',
  light: '#94a3b8',
  rule: '#9ca3af',
  ruleLight: '#d1d5db',
  easyText: '#166534',
  moderateText: '#92400e',
  hardText: '#991b1b',
} as const;

const PAGE = { w: 595, h: 842, ml: 56, mr: 56, mt: 50, mb: 55 } as const;
const CONTENT_W = PAGE.w - PAGE.ml - PAGE.mr;

export function generateAssignmentPDF(assignment: IAssignment, res: Response): void {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.mt, bottom: PAGE.mb, left: PAGE.ml, right: PAGE.mr },
    bufferPages: true,
    info: {
      Title: assignment.title,
      Author: 'VedaAI Assessment Creator',
      Subject: assignment.subject,
    },
  });

  const filename = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_exam.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  let totalMarks = 0;
  let totalQuestions = 0;
  assignment.sections.forEach((s) =>
    s.questions.forEach((q) => {
      totalMarks += q.marks;
      totalQuestions++;
    })
  );

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(PALETTE.ink)
    .text('Delhi Public School, Sector-4, Bokaro', PAGE.ml, PAGE.mt, { align: 'center', width: CONTENT_W });

  doc.moveDown(0.25);

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(PALETTE.mid)
    .text(`Subject: ${assignment.subject}   |   Class: ${assignment.grade}`, { align: 'center', width: CONTENT_W });

  drawRule(doc, doc.y + 8, 2, PALETTE.ink);
  doc.y += 14;

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(PALETTE.ink)
    .text('Time Allowed: 45 minutes', PAGE.ml, doc.y);

  doc.text(`Maximum Marks: ${totalMarks}`, PAGE.ml, doc.y - 13, { align: 'right', width: CONTENT_W });

  doc.moveDown(0.4);
  drawRule(doc, doc.y, 0.75, PALETTE.rule);
  doc.moveDown(0.55);

  const instrText = assignment.additionalInstructions?.slice(0, 220) || 'All questions are compulsory unless stated otherwise.';
  doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(PALETTE.mid).text(instrText, { align: 'center', width: CONTENT_W });

  doc.moveDown(0.8);

  const infoY = doc.y;
  doc.rect(PAGE.ml, infoY, CONTENT_W, 32).strokeColor(PALETTE.ruleLight).lineWidth(0.8).stroke();
  drawLabelField(doc, 'Name:', PAGE.ml + 8, infoY + 10, '______________________________', 55);
  drawLabelField(doc, 'Roll No:', PAGE.ml + 270, infoY + 10, '__________', 50);
  drawLabelField(doc, 'Class/Sec:', PAGE.ml + 390, infoY + 10, '______', 60);
  doc.y = infoY + 32 + 14;

  drawRule(doc, doc.y, 1.5, PALETTE.ink);
  doc.y += 10;

  let globalQNum = 0;
  const mcqAnswers: { num: number; answer: string }[] = [];

  assignment.sections.forEach((section, sIdx) => {
    ensureSpace(doc, 100);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(PALETTE.ink)
      .text(`SECTION ${String.fromCharCode(65 + sIdx)}`, PAGE.ml, doc.y, { underline: true });

    doc.moveDown(0.15);
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(PALETTE.mid).text(section.instruction, PAGE.ml, doc.y, { width: CONTENT_W });
    doc.moveDown(0.75);

    section.questions.forEach((q) => {
      globalQNum++;
      ensureSpace(doc, 60);

      const qY = doc.y;
      const numW = 22;
      const marksW = 48;
      const bodyW = CONTENT_W - numW - marksW;

      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(PALETTE.ink).text(`${globalQNum}.`, PAGE.ml, qY, { width: numW });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PALETTE.mid).text(`[${q.marks} M]`, PAGE.ml + numW + bodyW, qY, { width: marksW, align: 'right' });
      doc.font('Helvetica').fontSize(10.5).fillColor(PALETTE.ink).text(q.text, PAGE.ml + numW, qY, { width: bodyW, align: 'justify', lineGap: 1.5 });

      doc.moveDown(0.3);

      if (q.options && q.options.length > 0) {
        const baseY = doc.y;
        const colW = bodyW / 2;
        q.options.forEach((opt, oIdx) => {
          const col = oIdx % 2;
          const row = Math.floor(oIdx / 2);
          const optX = PAGE.ml + numW + col * colW;
          const optY = baseY + row * 16;
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PALETTE.mid).text(`(${String.fromCharCode(97 + oIdx)})`, optX, optY);
          doc.font('Helvetica').fontSize(9.5).fillColor(PALETTE.ink).text(opt, optX + 18, optY, { width: colW - 20 });
        });
        doc.y = baseY + Math.ceil(q.options.length / 2) * 16 + 4;

        if (q.correctAnswer) mcqAnswers.push({ num: globalQNum, answer: q.correctAnswer });
      }

      const diffColor = q.difficulty === 'Easy' ? PALETTE.easyText : q.difficulty === 'Moderate' ? PALETTE.moderateText : PALETTE.hardText;
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(diffColor).text(`[${q.difficulty}]`, PAGE.ml + numW, doc.y + 2);
      doc.moveDown(1.1);
    });

    doc.moveDown(0.4);
  });

  ensureSpace(doc, 40);
  drawRule(doc, doc.y, 0.75, PALETTE.ruleLight);
  doc.moveDown(0.5);
  doc.font('Helvetica-Oblique').fontSize(10).fillColor(PALETTE.muted).text('— End of Question Paper —', { align: 'center', width: CONTENT_W });

  if (mcqAnswers.length > 0) {
    ensureSpace(doc, 80);
    doc.moveDown(1.2);
    drawRule(doc, doc.y, 1.5, PALETTE.ink);
    doc.y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(PALETTE.ink).text('ANSWER KEY', PAGE.ml, doc.y, { underline: true });
    doc.moveDown(0.6);

    const colW = CONTENT_W / 4;
    const baseKeyY = doc.y;

    mcqAnswers.forEach((item, idx) => {
      const x = PAGE.ml + (idx % 4) * colW;
      const y = baseKeyY + Math.floor(idx / 4) * 18;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PALETTE.ink).text(`${item.num}.`, x, y);
      doc.font('Helvetica').fillColor(PALETTE.mid).text(item.answer, x + 18, y, { width: colW - 20 });
    });

    doc.y = baseKeyY + Math.ceil(mcqAnswers.length / 4) * 18 + 12;
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const footerY = PAGE.h - PAGE.mb + 6;
    doc.strokeColor(PALETTE.ruleLight).lineWidth(0.5).moveTo(PAGE.ml, footerY).lineTo(PAGE.w - PAGE.mr, footerY).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(PALETTE.light).text('Generated by VedaAI Assessment Creator  |  For academic use only.', PAGE.ml, footerY + 5);
    doc.font('Helvetica').fontSize(7.5).fillColor(PALETTE.light).text(`Page ${i + 1} of ${range.count}`, PAGE.ml, footerY + 5, { width: CONTENT_W, align: 'right' });
  }

  doc.end();
}

function drawRule(doc: PDFKit.PDFDocument, y: number, weight: number, color: string): void {
  doc.strokeColor(color).lineWidth(weight).moveTo(PAGE.ml, y).lineTo(PAGE.w - PAGE.mr, y).stroke();
}

function drawLabelField(doc: PDFKit.PDFDocument, label: string, x: number, y: number, line: string, labelWidth: number): void {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(PALETTE.ink).text(label, x, y, { lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(PALETTE.mid).text(line, x + labelWidth, y, { lineBreak: false });
}

function ensureSpace(doc: PDFKit.PDFDocument, minRemaining: number): void {
  if (PAGE.h - PAGE.mb - doc.y < minRemaining) doc.addPage();
}
