import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { IAssignment } from '../models/Assignment';

/**
 * Generates an elegant, print-ready PDF exam paper matching classic board formats and writes it directly to the response stream.
 */
export const generateAssignmentPDF = (assignment: IAssignment, res: Response): void => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true, // Enables header/footer calculations on page end
  });

  // Set response headers to prompt a file download
  const filename = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_exam.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Pipe the document directly to the Express response
  doc.pipe(res);

  // Define styling standards
  const primaryColor = '#1e293b'; // Slate 800
  const secondaryColor = '#475569'; // Slate 600
  const accentColor = '#f97316'; // Orange 500
  const lightGrey = '#94a3b8'; // Slate 400
  const dividerColor = '#cbd5e1'; // Slate 300

  // 1. Header Area
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(assignment.title.toUpperCase(), { align: 'center' });
  
  doc.moveDown(0.3);

  // Subheader containing metadata
  doc
    .fillColor(secondaryColor)
    .font('Helvetica')
    .fontSize(10)
    .text(`Subject: ${assignment.subject}   |   Grade Level: ${assignment.grade}   |   Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}`, {
      align: 'center',
    });

  doc.moveDown(0.6);

  // Draw Header Divider
  doc
    .strokeColor(dividerColor)
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.8);

  // 2. Student Details Box (Figma Match)
  const studentBoxY = doc.y;
  doc
    .rect(50, studentBoxY, 495, 45)
    .strokeColor(dividerColor)
    .lineWidth(1)
    .stroke();

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('STUDENT NAME:', 60, studentBoxY + 16)
    .font('Helvetica')
    .text('________________________________', 145, studentBoxY + 16);

  doc
    .font('Helvetica-Bold')
    .text('ROLL NO:', 320, studentBoxY + 16)
    .font('Helvetica')
    .text('___________', 370, studentBoxY + 16);

  doc
    .font('Helvetica-Bold')
    .text('SEC:', 445, studentBoxY + 16)
    .font('Helvetica')
    .text('_______', 475, studentBoxY + 16);

  doc.y = studentBoxY + 45; // Reset pointer below box
  doc.moveDown(1.2);

  // 3. Instructions Section
  if (assignment.additionalInstructions) {
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('GENERAL INSTRUCTIONS:');

    doc
      .fillColor(secondaryColor)
      .font('Helvetica-Oblique')
      .fontSize(9)
      .text(assignment.additionalInstructions, { align: 'justify', lineGap: 2 });
    
    doc.moveDown(1.5);
  }

  // Calculate Total Marks dynamically
  let totalMarks = 0;
  assignment.sections.forEach((s) => {
    s.questions.forEach((q) => {
      totalMarks += q.marks;
    });
  });

  doc
    .fillColor(accentColor)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(`TOTAL MARKS: ${totalMarks}`, { align: 'right' });

  doc.moveDown(1.0);

  // 4. Sections Rendering
  assignment.sections.forEach((section, sIndex) => {
    // Check height remaining, add page if tight
    if (doc.y > 700) {
      doc.addPage();
    }

    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(section.title.toUpperCase(), { underline: true });

    doc
      .fillColor(secondaryColor)
      .font('Helvetica-Oblique')
      .fontSize(9)
      .text(`Instruction: ${section.instruction}`);

    doc.moveDown(0.8);

    section.questions.forEach((question, qIndex) => {
      // Question header block height check
      if (doc.y > 720) {
        doc.addPage();
      }

      const qNum = `${qIndex + 1}.`;
      const originalY = doc.y;

      // Question Number column
      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(qNum, 50, originalY);

      // Marks display (Right-Aligned)
      const marksText = `[${question.marks} M]`;
      doc
        .fillColor(secondaryColor)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(marksText, 510, originalY, { align: 'right' });

      // Question body text (Indented Column)
      doc
        .fillColor(primaryColor)
        .font('Helvetica')
        .fontSize(10)
        .text(question.text, 70, originalY, { width: 430, align: 'justify' });

      // Difficulty badge/tag text (Small print)
      doc
        .fillColor(lightGrey)
        .font('Helvetica')
        .fontSize(8)
        .text(`(Difficulty: ${question.difficulty})`, 70, doc.y + 2);

      doc.moveDown(0.4);

      // Handle Multiple Choice Options if applicable
      if (question.options && question.options.length > 0) {
        doc.moveDown(0.2);
        
        // Render options in a neat 2x2 grid layout to save height and look standard
        const baseOptionsY = doc.y;
        
        question.options.forEach((opt, oIdx) => {
          const gridCol = oIdx % 2;
          const gridRow = Math.floor(oIdx / 2);
          
          const optX = gridCol === 0 ? 80 : 300;
          const optY = baseOptionsY + gridRow * 18;
          const optLabel = `${String.fromCharCode(65 + oIdx)}) `; // A), B)...

          doc
            .fillColor(secondaryColor)
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .text(optLabel, optX, optY)
            .font('Helvetica')
            .text(opt, optX + 15, optY, { width: 200 });
        });
        
        // Push line pointer down past the options block height
        doc.y = baseOptionsY + Math.ceil(question.options.length / 2) * 18;
      }

      doc.moveDown(1.2);
    });

    doc.moveDown(0.8);
  });

  // 5. Global Header & Footer generation for A4 template pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Draw Footer Page Number details
    doc
      .strokeColor(dividerColor)
      .lineWidth(0.5)
      .moveTo(50, 795)
      .lineTo(545, 795)
      .stroke();

    doc
      .fillColor(lightGrey)
      .font('Helvetica')
      .fontSize(8)
      .text('Generated by VedaAI Assessment Creator  |  For academic verification only.', 50, 802)
      .text(`Page ${i + 1} of ${range.count}`, 510, 802, { align: 'right' });
  }

  // Finalize the PDF stream
  doc.end();
};
