import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { IAssignment, ISection, IQuestion } from '../models/Assignment';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  black:   '#000000',
  ink:     '#1a1a1a',
  dark:    '#1e293b',
  mid:     '#475569',
  muted:   '#64748b',
  light:   '#94a3b8',
  rule:    '#9ca3af',
  ruleLight: '#d1d5db',
  easyBg:  '#F0FDF4',
  modBg:   '#FFFBEB',
  hardBg:  '#FEF2F2',
};

// Page geometry
const PAGE = { w: 595, h: 842, ml: 56, mr: 56, mt: 50, mb: 55 };
const CONTENT_W = PAGE.w - PAGE.ml - PAGE.mr;

/**
 * Generates a polished, board-exam-style A4 PDF and pipes it to the Express response.
 */
export const generateAssignmentPDF = (assignment: IAssignment, res: Response): void => {
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

  // ── Totals ─────────────────────────────────────────────────────────────────
  let totalMarks = 0;
  let totalQuestions = 0;
  assignment.sections.forEach(s => s.questions.forEach(q => { totalMarks += q.marks; totalQuestions++; }));

  // ── 1. School / Exam Header ────────────────────────────────────────────────
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(C.ink)
    .text('Delhi Public School, Sector-4, Bokaro', PAGE.ml, PAGE.mt, {
      align: 'center', width: CONTENT_W,
    });

  doc.moveDown(0.25);

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(C.mid)
    .text(`Subject: ${assignment.subject}   |   Class: ${assignment.grade}`, {
      align: 'center', width: CONTENT_W,
    });

  // Bold top rule
  const ruleY1 = doc.y + 8;
  rule(doc, ruleY1, 2, C.ink);
  doc.y = ruleY1 + 6;

  // Time / Marks row
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(C.ink)
    .text('Time Allowed: 45 minutes', PAGE.ml, doc.y)
    .text(`Maximum Marks: ${totalMarks}`, PAGE.ml, doc.y - 13, { align: 'right', width: CONTENT_W });

  doc.moveDown(0.4);

  // Thin rule
  rule(doc, doc.y, 0.75, C.rule);
  doc.moveDown(0.55);

  // Instructions
  const instrText = assignment.additionalInstructions
    ? assignment.additionalInstructions.slice(0, 220)
    : 'All questions are compulsory unless stated otherwise.';
  doc
    .font('Helvetica-Oblique')
    .fontSize(9.5)
    .fillColor(C.mid)
    .text(instrText, { align: 'center', width: CONTENT_W });

  doc.moveDown(0.8);

  // ── 2. Student Info Fields ─────────────────────────────────────────────────
  const infoY = doc.y;
  const infoH = 32;
  doc.rect(PAGE.ml, infoY, CONTENT_W, infoH).strokeColor(C.ruleLight).lineWidth(0.8).stroke();

  // Name
  labelField(doc, 'Name:', PAGE.ml + 8, infoY + 10, '______________________________', 55);
  // Roll No
  labelField(doc, 'Roll No:', PAGE.ml + 270, infoY + 10, '__________', 50);
  // Section
  labelField(doc, 'Class/Sec:', PAGE.ml + 390, infoY + 10, '______', 60);

  doc.y = infoY + infoH + 14;

  // Bold rule before sections
  rule(doc, doc.y, 1.5, C.ink);
  doc.y = doc.y + 10;

  // ── 3. Question Sections ───────────────────────────────────────────────────
  let globalQNum = 0;
  const mcqAnswers: { num: number; answer: string }[] = [];

  assignment.sections.forEach((section, sIdx) => {
    pageBreakIfNeeded(doc, 100);

    const sectionLabel = String.fromCharCode(65 + sIdx);

    // Section heading
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(C.ink)
      .text(`SECTION ${sectionLabel}`, PAGE.ml, doc.y, { underline: true });

    doc.moveDown(0.15);

    doc
      .font('Helvetica-Oblique')
      .fontSize(9.5)
      .fillColor(C.mid)
      .text(section.instruction, PAGE.ml, doc.y, { width: CONTENT_W });

    doc.moveDown(0.75);

    section.questions.forEach((question) => {
      globalQNum++;

      pageBreakIfNeeded(doc, 60);

      const qY = doc.y;
      const numColW = 22;
      const marksW = 48;
      const bodyW = CONTENT_W - numColW - marksW;

      // Question number
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor(C.ink)
        .text(`${globalQNum}.`, PAGE.ml, qY, { width: numColW });

      // Marks (right-aligned)
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(C.mid)
        .text(`[${question.marks} M]`, PAGE.ml + numColW + bodyW, qY, { width: marksW, align: 'right' });

      // Question text
      doc
        .font('Helvetica')
        .fontSize(10.5)
        .fillColor(C.ink)
        .text(question.text, PAGE.ml + numColW, qY, { width: bodyW, align: 'justify', lineGap: 1.5 });

      doc.moveDown(0.3);

      // MCQ Options — 2-column grid
      if (question.options && question.options.length > 0) {
        const baseY = doc.y;
        const colW = bodyW / 2;
        question.options.forEach((opt, oIdx) => {
          const col = oIdx % 2;
          const row = Math.floor(oIdx / 2);
          const optX = PAGE.ml + numColW + col * colW;
          const optY = baseY + row * 16;
          const label = `(${String.fromCharCode(97 + oIdx)})`;

          doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.mid).text(label, optX, optY);
          doc.font('Helvetica').fontSize(9.5).fillColor(C.ink).text(opt, optX + 18, optY, { width: colW - 20 });
        });
        doc.y = baseY + Math.ceil(question.options.length / 2) * 16 + 4;

        if (question.correctAnswer) {
          mcqAnswers.push({ num: globalQNum, answer: question.correctAnswer });
        }
      }

      // Difficulty tag — small italic bracket text
      doc
        .font('Helvetica-Oblique')
        .fontSize(8.5)
        .fillColor(
          question.difficulty === 'Easy' ? '#166534' :
          question.difficulty === 'Moderate' ? '#92400e' : '#991b1b'
        )
        .text(`[${question.difficulty}]`, PAGE.ml + numColW, doc.y + 2);

      doc.moveDown(1.1);
    });

    doc.moveDown(0.4);
  });

  // ── 4. End of Paper ───────────────────────────────────────────────────────
  pageBreakIfNeeded(doc, 40);
  rule(doc, doc.y, 0.75, C.ruleLight);
  doc.moveDown(0.5);
  doc
    .font('Helvetica-Oblique')
    .fontSize(10)
    .fillColor(C.muted)
    .text('— End of Question Paper —', { align: 'center', width: CONTENT_W });

  // ── 5. Answer Key (MCQ) ────────────────────────────────────────────────────
  if (mcqAnswers.length > 0) {
    pageBreakIfNeeded(doc, 80);
    doc.moveDown(1.2);
    rule(doc, doc.y, 1.5, C.ink);
    doc.y = doc.y + 10;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(C.ink)
      .text('ANSWER KEY', PAGE.ml, doc.y, { underline: true });

    doc.moveDown(0.6);

    const colW = CONTENT_W / 4;
    let col = 0;
    let baseKeyY = doc.y;

    mcqAnswers.forEach((item, idx) => {
      const x = PAGE.ml + col * colW;
      const y = baseKeyY + Math.floor(idx / 4) * 18;

      doc
        .font('Helvetica-Bold').fontSize(9.5).fillColor(C.ink)
        .text(`${item.num}.`, x, y)
        .font('Helvetica').fillColor(C.mid)
        .text(item.answer, x + 18, y, { width: colW - 20 });

      col = (col + 1) % 4;
    });

    doc.y = baseKeyY + Math.ceil(mcqAnswers.length / 4) * 18 + 12;
  }

  // ── 6. Per-Page Headers & Footers ─────────────────────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Footer
    const footerY = PAGE.h - PAGE.mb + 6;
    doc
      .strokeColor(C.ruleLight).lineWidth(0.5)
      .moveTo(PAGE.ml, footerY).lineTo(PAGE.w - PAGE.mr, footerY).stroke();

    doc
      .font('Helvetica').fontSize(7.5).fillColor(C.light)
      .text('Generated by VedaAI Assessment Creator  |  For academic use only.', PAGE.ml, footerY + 5);

    doc
      .font('Helvetica').fontSize(7.5).fillColor(C.light)
      .text(`Page ${i + 1} of ${range.count}`, PAGE.ml, footerY + 5, {
        width: CONTENT_W, align: 'right',
      });
  }

  doc.end();
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function rule(doc: any, y: number, weight: number, color: string) {
  doc
    .strokeColor(color)
    .lineWidth(weight)
    .moveTo(PAGE.ml, y)
    .lineTo(PAGE.w - PAGE.mr, y)
    .stroke();
}

function labelField(doc: any, label: string, x: number, y: number, line: string, lineWidth: number) {
  doc
    .font('Helvetica-Bold').fontSize(9).fillColor(C.ink)
    .text(label, x, y, { lineBreak: false });

  doc
    .font('Helvetica').fontSize(9).fillColor(C.mid)
    .text(line, x + lineWidth, y, { lineBreak: false });
}

function pageBreakIfNeeded(doc: any, minRemaining: number) {
  const remaining = PAGE.h - PAGE.mb - doc.y;
  if (remaining < minRemaining) {
    doc.addPage();
  }
}
