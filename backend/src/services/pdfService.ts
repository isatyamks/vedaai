import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { IAssignment } from '../models/Assignment';

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginLeft: 60,
  marginRight: 60,
  marginTop: 60,
  marginBottom: 60,
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight;

export async function generateAssignmentPDF(
  assignment: IAssignment,
  res: Response,
  requestedSet?: string
): Promise<void> {

  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: PAGE.marginTop,
      bottom: PAGE.marginBottom,
      left: PAGE.marginLeft,
      right: PAGE.marginRight,
    },
    bufferPages: true,
    autoFirstPage: true,
  });

  const SERIF = 'Times-Roman';
  const SERIF_BOLD = 'Times-Bold';
  const SERIF_ITALIC = 'Times-Italic';

  const filename = `${assignment.title
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()}_paper.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  let sets = assignment.sets?.length
    ? assignment.sets
    : [{ setName: 'A', sections: assignment.sections }];

  if (requestedSet) {
    const filtered = sets.filter((s) => s.setName === requestedSet);
    if (filtered.length > 0) sets = filtered;
  }

  const usedSections = sets[0]?.sections ?? assignment.sections;
  let totalMarks = 0;
  usedSections.forEach((sec) => sec.questions.forEach((q) => { totalMarks += q.marks; }));

  sets.forEach((set, setIndex) => {
    if (setIndex > 0) doc.addPage();

    let y = PAGE.marginTop;

    doc
      .font(SERIF_BOLD)
      .fontSize(16)
      .fillColor('#000000')
      .text('Delhi Public School, Sector-4, Bokaro', PAGE.marginLeft, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    y = doc.y + 2;

    const subjectLine = `Subject: ${assignment.subject}  |  Class: ${assignment.grade}${sets.length > 1 ? `  |  SET ${set.setName}` : ''}`;
    doc
      .font(SERIF)
      .fontSize(11)
      .fillColor('#333333')
      .text(subjectLine, PAGE.marginLeft, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    y = doc.y + 6;

    doc
      .moveTo(PAGE.marginLeft, y)
      .lineTo(PAGE.width - PAGE.marginRight, y)
      .lineWidth(2)
      .strokeColor('#000000')
      .stroke();

    y += 8;

    doc
      .font(SERIF)
      .fontSize(11)
      .fillColor('#222222')
      .text('Time Allowed: 45 minutes', PAGE.marginLeft, y, {
        width: Math.floor(CONTENT_WIDTH / 2),
        align: 'left',
      });

    doc
      .font(SERIF)
      .fontSize(11)
      .fillColor('#222222')
      .text(`Maximum Marks: ${totalMarks}`, PAGE.marginLeft + Math.ceil(CONTENT_WIDTH / 2), y, {
        width: Math.floor(CONTENT_WIDTH / 2),
        align: 'right',
      });

    y = doc.y + 5;

    doc
      .moveTo(PAGE.marginLeft, y)
      .lineTo(PAGE.width - PAGE.marginRight, y)
      .lineWidth(0.75)
      .strokeColor('#555555')
      .stroke();

    y += 8;

    const instructions = assignment.additionalInstructions || 'All questions are compulsory unless stated otherwise.';
    doc
      .font(SERIF_ITALIC)
      .fontSize(10.5)
      .fillColor('#444444')
      .text(instructions, PAGE.marginLeft, y, {
        width: CONTENT_WIDTH,
        align: 'center',
        lineGap: 2,
      });

    y = doc.y + 10;

    const nameColW = 200;
    const rollColW = 150;
    const classColW = CONTENT_WIDTH - nameColW - rollColW;

    doc
      .font(SERIF_BOLD)
      .fontSize(10.5)
      .fillColor('#000000')
      .text('Name: ____________________________', PAGE.marginLeft, y, {
        width: nameColW,
        lineBreak: false,
      });

    doc
      .font(SERIF_BOLD)
      .fontSize(10.5)
      .fillColor('#000000')
      .text('Roll No: __________', PAGE.marginLeft + nameColW, y, {
        width: rollColW,
        lineBreak: false,
      });

    doc
      .font(SERIF_BOLD)
      .fontSize(10.5)
      .fillColor('#000000')
      .text('Class/Sec: ______', PAGE.marginLeft + nameColW + rollColW, y, {
        width: classColW,
        lineBreak: false,
      });

    y = doc.y + 8;

    doc
      .moveTo(PAGE.marginLeft, y)
      .lineTo(PAGE.width - PAGE.marginRight, y)
      .lineWidth(2)
      .strokeColor('#000000')
      .stroke();

    y += 14;
    doc.y = y;

    let questionNumber = 1;

    set.sections.forEach((section, sIdx) => {
      const sectionLabel = String.fromCharCode(65 + sIdx);

      checkPageBreak(doc, 60);

      doc
        .font(SERIF_BOLD)
        .fontSize(12)
        .fillColor('#000000')
        .text(`Section ${sectionLabel}`, PAGE.marginLeft, doc.y, {
          width: CONTENT_WIDTH,
          align: 'left',
          underline: true,
        });

      doc.moveDown(0.25);

      if (section.instruction) {
        doc
          .font(SERIF_ITALIC)
          .fontSize(10.5)
          .fillColor('#555555')
          .text(section.instruction, PAGE.marginLeft, doc.y, {
            width: CONTENT_WIDTH,
            align: 'left',
            lineGap: 2,
          });

        doc.moveDown(0.5);
      }

      section.questions.forEach((q) => {
        const marksLabel = `[${q.marks} Mark${q.marks !== 1 ? 's' : ''}]`;

        const numColW = 22;
        const marksColW = 60;
        const textColW = CONTENT_WIDTH - numColW - marksColW - 8;

        const qTextHeight = doc.heightOfString(q.text, {
          width: textColW,
          lineGap: 4,
        });

        let optsHeight = 0;
        if (q.options?.length) {
          const preColW = Math.floor((textColW - 16) / 2);
          const preRowCount = Math.ceil(q.options.length / 2);
          for (let row = 0; row < preRowCount; row++) {
            let maxH = 0;
            for (let col = 0; col < 2; col++) {
              const oIdx = row * 2 + col;
              if (oIdx >= q.options.length) break;
              const label = `(${String.fromCharCode(97 + oIdx)}) ${q.options[oIdx]}`;
              const h = doc.heightOfString(label, { width: preColW, lineGap: 2 });
              if (h > maxH) maxH = h;
            }
            optsHeight += maxH + 8;
          }
          optsHeight += 10;
        }

        const totalH = qTextHeight + optsHeight + 32;
        checkPageBreak(doc, totalH);

        const startY = doc.y;

        doc
          .font(SERIF_BOLD)
          .fontSize(11)
          .fillColor('#000000')
          .text(`${questionNumber}.`, PAGE.marginLeft, startY, {
            width: numColW,
            lineBreak: false,
          });

        doc
          .font(SERIF)
          .fontSize(11)
          .fillColor('#111111')
          .text(q.text, PAGE.marginLeft + numColW, startY, {
            width: textColW,
            align: 'left',
            lineGap: 4,
          });

        doc
          .font(SERIF_ITALIC)
          .fontSize(10)
          .fillColor('#555555')
          .text(marksLabel, PAGE.marginLeft + numColW + textColW + 8, startY, {
            width: marksColW,
            align: 'right',
            lineBreak: false,
          });

        doc.y = startY + qTextHeight + 8;

        if (q.options?.length) {
          const optStartX = PAGE.marginLeft + numColW;
          const colW = Math.floor((textColW - 16) / 2);
          const optCount = q.options.length;
          const rowCount = Math.ceil(optCount / 2);

          const rowHeights: number[] = [];
          for (let row = 0; row < rowCount; row++) {
            let maxH = 0;
            for (let col = 0; col < 2; col++) {
              const oIdx = row * 2 + col;
              if (oIdx >= optCount) break;
              const label = `(${String.fromCharCode(97 + oIdx)}) ${q.options![oIdx]}`;
              const h = doc.heightOfString(label, { width: colW, lineGap: 2 });
              if (h > maxH) maxH = h;
            }
            rowHeights.push(maxH + 8);
          }

          const totalOptH = rowHeights.reduce((a, b) => a + b, 0) + 6;
          checkPageBreak(doc, totalOptH);

          for (let row = 0; row < rowCount; row++) {
            const rowY = doc.y;

            for (let col = 0; col < 2; col++) {
              const oIdx = row * 2 + col;
              if (oIdx >= optCount) break;

              const ox = optStartX + col * (colW + 16);
              const optLabel = `(${String.fromCharCode(97 + oIdx)}) ${q.options![oIdx]}`;

              doc
                .font(SERIF)
                .fontSize(10.5)
                .fillColor('#333333')
                .text(optLabel, ox, rowY, {
                  width: colW,
                  lineGap: 2,
                });
            }

            doc.y = rowY + rowHeights[row];
          }

          doc.moveDown(0.2);
        }

        doc.moveDown(0.6);
        questionNumber++;
      });

      doc.moveDown(0.8);
    });

    checkPageBreak(doc, 30);
    doc.moveDown(0.5);

    doc
      .moveTo(PAGE.marginLeft, doc.y)
      .lineTo(PAGE.width - PAGE.marginRight, doc.y)
      .lineWidth(0.5)
      .strokeColor('#cccccc')
      .stroke();

    doc.moveDown(0.5);

    doc
      .font(SERIF_ITALIC)
      .fontSize(11)
      .fillColor('#666666')
      .text('— End of Question Paper —', PAGE.marginLeft, doc.y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
  });

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const savedMargins = { ...(doc.page as any).margins };
    (doc.page as any).margins.bottom = 0;

    doc
      .font(SERIF)
      .fontSize(9)
      .fillColor('#999999')
      .text(
        `Page ${i - range.start + 1} of ${range.count}`,
        PAGE.marginLeft,
        PAGE.height - 42,
        { width: CONTENT_WIDTH, align: 'center' }
      );

    (doc.page as any).margins = savedMargins;
  }

  doc.end();
}

function checkPageBreak(doc: PDFKit.PDFDocument, neededHeight: number): void {
  const usableBottom = PAGE.height - PAGE.marginBottom;
  if (doc.y + neededHeight > usableBottom) {
    if (doc.y > PAGE.marginTop + 30) {
      doc.addPage();
    }
  }
}