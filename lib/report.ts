import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from 'pdf-lib';

import { AssessmentScores, ProfileKey, profiles } from './assessment';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
// The page title occupies the band down to roughly y=590. Body content starts
// below it so numbered rows and reflection prompts never collide with headings.
const CONTENT_TOP = 575;

const rose = rgb(196 / 255, 104 / 255, 122 / 255);
const navy = rgb(24 / 255, 44 / 255, 64 / 255);
const blush = rgb(253 / 255, 240 / 255, 243 / 255);
const paper = rgb(253 / 255, 249 / 255, 250 / 255);
const charcoal = rgb(28 / 255, 25 / 255, 37 / 255);
const muted = rgb(112 / 255, 92 / 255, 104 / 255);
const rule = rgb(231 / 255, 215 / 255, 220 / 255);
const sage = rgb(112 / 255, 148 / 255, 128 / 255);
const white = rgb(1, 1, 1);

type ReportInput = {
  firstName: string;
  completedAt: string;
  scores: AssessmentScores;
  logoBytes?: Uint8Array;
};

type ParagraphOptions = {
  x: number;
  y: number;
  width: number;
  size?: number;
  lineHeight?: number;
  color?: ReturnType<typeof rgb>;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) <= maxWidth) {
      line = attempt;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function paragraphHeight(text: string, font: PDFFont, width: number, size = 10.5, lineHeight = 16) {
  return wrapText(text, font, size, width).length * lineHeight;
}

function drawParagraph(page: PDFPage, text: string, font: PDFFont, options: ParagraphOptions) {
  const size = options.size ?? 10.5;
  const lineHeight = options.lineHeight ?? 16;
  const lines = wrapText(text, font, size, options.width);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: options.x,
      y: options.y - index * lineHeight,
      size,
      font,
      color: options.color ?? charcoal,
    });
  });
  return options.y - lines.length * lineHeight;
}

function drawCenteredText(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color: ReturnType<typeof rgb>) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font, color });
}

function drawRightText(page: PDFPage, text: string, font: PDFFont, size: number, right: number, y: number, color: ReturnType<typeof rgb>) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: right - width, y, size, font, color });
}

function drawBulletList(page: PDFPage, items: string[], font: PDFFont, x: number, y: number, width: number) {
  let cursor = y;
  for (const item of items) {
    page.drawCircle({ x: x + 3, y: cursor + 3, size: 2.4, color: rose });
    cursor = drawParagraph(page, item, font, {
      x: x + 15,
      y: cursor + 7,
      width: width - 15,
      size: 10,
      lineHeight: 15,
      color: muted,
    }) - 7;
  }
  return cursor;
}

function listHeight(items: string[], font: PDFFont, width: number) {
  return items.reduce((height, item) => height + paragraphHeight(item, font, width - 15, 10, 15) + 7, 0);
}

export async function createAttachmentReport({ firstName, completedAt, scores, logoBytes }: ReportInput) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${firstName}'s Personalized Attachment Profile`);
  pdf.setAuthor('Bev Mitelman, M.A. - Securely Loved');
  pdf.setSubject('Personalized Attachment Profile');
  pdf.setCreator('Securely Loved');

  const heading = await pdf.embedFont(StandardFonts.TimesRoman);
  const headingBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bodyBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = logoBytes ? await pdf.embedPng(logoBytes) : undefined;
  const pageSize: [number, number] = [PAGE_WIDTH, PAGE_HEIGHT];

  const addPage = (title: string, kicker: string) => {
    const page = pdf.addPage(pageSize);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: paper });
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 14, width: PAGE_WIDTH, height: 14, color: rose });
    if (logo) page.drawImage(logo, { x: MARGIN, y: 704, width: 54, height: 54 });
    else page.drawText('SECURELY LOVED', { x: MARGIN, y: 728, size: 11, font: bodyBold, color: navy });
    page.drawLine({ start: { x: MARGIN, y: 686 }, end: { x: PAGE_WIDTH - MARGIN, y: 686 }, thickness: 0.7, color: rule });
    page.drawText(kicker.toUpperCase(), { x: MARGIN, y: 657, size: 8, font: bodyBold, color: rose });
    page.drawText(title, { x: MARGIN, y: 619, size: 25, font: headingBold, color: charcoal });
    return page;
  };

  const drawCallout = (page: PDFPage, title: string, text: string, y: number, height: number, fill = blush) => {
    page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height, color: fill, borderColor: rule, borderWidth: 0.7 });
    page.drawText(title, { x: MARGIN + 20, y: y + height - 31, size: 13, font: headingBold, color: rose });
    drawParagraph(page, text, body, { x: MARGIN + 20, y: y + height - 55, width: CONTENT_WIDTH - 40, size: 10, lineHeight: 15, color: muted });
  };

  const primary = profiles[scores.primary];
  const secondary = profiles[scores.secondary];
  const dateLabel = new Date(completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  {
    const page = pdf.addPage(pageSize);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: blush });
    page.drawRectangle({ x: 30, y: 30, width: PAGE_WIDTH - 60, height: PAGE_HEIGHT - 60, borderColor: white, borderWidth: 2 });
    if (logo) page.drawImage(logo, { x: 231, y: 590, width: 150, height: 150 });
    drawCenteredText(page, 'P E R S O N A L I Z E D', bodyBold, 8.5, 548, rose);
    drawCenteredText(page, 'Attachment Profile', headingBold, 38, 490, charcoal);
    drawCenteredText(page, `Prepared for ${firstName}`, heading, 16, 444, muted);
    page.drawLine({ start: { x: 206, y: 416 }, end: { x: 406, y: 416 }, thickness: 1, color: rose });
    const profileLabel = scores.isBlend ? `${primary.shortName} + ${secondary.shortName}` : primary.name;
    wrapText(profileLabel, headingBold, 21, 460).forEach((line, index) => drawCenteredText(page, line, headingBold, 21, 350 - index * 28, navy));
    drawCenteredText(page, 'Your relationship patterns are learned - and they can change.', body, 11.5, 191, muted);
    drawCenteredText(page, `Created by Bev Mitelman, M.A.  |  ${dateLabel}`, body, 9, 74, muted);
  }

  {
    const page = addPage('Your profile at a glance', 'Your results');
    const intro = scores.isBlend
      ? `Your responses point to a blended profile. ${primary.shortName} is your leading pattern, with ${secondary.shortName} close enough that both deserve meaningful attention.`
      : `Your responses align most strongly with ${primary.name}. Your other scores still matter: attachment is a pattern of tendencies, not a box that defines you.`;
    drawParagraph(page, intro, body, { x: MARGIN, y: CONTENT_TOP - 6, width: CONTENT_WIDTH, size: 11, lineHeight: 17, color: muted });
    const bars: Array<[string, number, ReturnType<typeof rgb>]> = [
      ['Attachment anxiety', scores.anxiety, rose],
      ['Attachment avoidance', scores.avoidance, navy],
      ['Secure functioning', scores.secureCapacity, sage],
    ];
    let y = 514;
    for (const [label, value, color] of bars) {
      page.drawText(label, { x: MARGIN, y, size: 10, font: bodyBold, color: charcoal });
      drawRightText(page, `${value} / 100`, bodyBold, 10, PAGE_WIDTH - MARGIN, y, color);
      page.drawRectangle({ x: MARGIN, y: y - 17, width: CONTENT_WIDTH, height: 9, color: rgb(.94, .91, .92) });
      page.drawRectangle({ x: MARGIN, y: y - 17, width: CONTENT_WIDTH * value / 100, height: 9, color });
      y -= 60;
    }
    drawCallout(page, 'How to read these scores', 'These are profile scores based on your responses, not clinical percentiles. Higher anxiety suggests greater sensitivity to possible disconnection. Higher avoidance suggests a stronger impulse to create distance from emotional dependence. Secure functioning reflects skills for communication, boundaries, regulation, and repair.', 154, 138, white);
  }

  const drawProfilePage = (key: ProfileKey, label: string) => {
    const profile = profiles[key];
    const page = addPage(profile.name, label);
    const essenceBottom = drawParagraph(page, profile.essence, body, { x: MARGIN, y: CONTENT_TOP - 6, width: CONTENT_WIDTH, size: 11, lineHeight: 17, color: muted });
    const gap = 24;
    const columnWidth = (CONTENT_WIDTH - gap) / 2;
    const cardHeight = Math.max(listHeight(profile.strengths, body, columnWidth - 28), listHeight(profile.needs, body, columnWidth - 28)) + 67;
    const cardTop = essenceBottom - 22;
    const cardY = cardTop - cardHeight;
    const drawListCard = (x: number, title: string, items: string[]) => {
      page.drawRectangle({ x, y: cardY, width: columnWidth, height: cardHeight, color: white, borderColor: rule, borderWidth: 0.7 });
      page.drawText(title, { x: x + 16, y: cardY + cardHeight - 31, size: 13, font: headingBold, color: navy });
      drawBulletList(page, items, body, x + 16, cardY + cardHeight - 62, columnWidth - 32);
    };
    drawListCard(MARGIN, 'Strengths you may bring', profile.strengths);
    drawListCard(MARGIN + columnWidth + gap, 'What helps you feel safe', profile.needs);
    drawCallout(page, 'A compassionate reframe', 'This pattern is not a flaw. It is an intelligent strategy your nervous system learned in the context of earlier relationships. Awareness gives you more choice about when that strategy still protects you and when it costs you connection.', 92, 130);
  };
  drawProfilePage(scores.primary, 'Your leading pattern');
  if (scores.isBlend) drawProfilePage(scores.secondary, 'Your closely matched pattern');

  {
    const page = addPage('Your triggers and relationship needs', 'What activates your system');
    const triggers = [...new Set([...primary.triggers, ...(scores.isBlend ? secondary.triggers.slice(0, 2) : [])])].slice(0, 6);
    const needs = [...new Set([...primary.needs, ...(scores.isBlend ? secondary.needs.slice(0, 2) : [])])].slice(0, 6);
    const gap = 24;
    const columnWidth = (CONTENT_WIDTH - gap) / 2;
    const cardY = 285;
    const cardHeight = 306;
    const drawListCard = (x: number, title: string, items: string[]) => {
      page.drawRectangle({ x, y: cardY, width: columnWidth, height: cardHeight, color: white, borderColor: rule, borderWidth: 0.7 });
      drawParagraph(page, title, headingBold, { x: x + 17, y: cardY + cardHeight - 34, width: columnWidth - 34, size: 14, lineHeight: 17, color: navy });
      drawBulletList(page, items, body, x + 17, cardY + cardHeight - 86, columnWidth - 34);
    };
    drawListCard(MARGIN, 'Triggers to notice with curiosity', triggers);
    drawListCard(MARGIN + columnWidth + gap, 'Needs that support connection', needs);
    drawCallout(page, 'Try this language', 'I notice my attachment system is activated. The story I am telling myself is ____. What I need most right now is ____. Could we talk about what is actually happening?', 92, 152);
  }

  {
    const page = addPage('Communication, conflict, and repair', 'Your relational cycle');
    const cycle = scores.primary === 'anxious'
      ? 'When connection feels uncertain, you may move toward the relationship quickly: asking, explaining, checking, or trying harder. If reassurance does not land, urgency can rise.'
      : scores.primary === 'dismissive'
        ? 'When emotion feels urgent or demanding, you may move away from the relationship: becoming quiet, practical, busy, or internally detached. Distance can feel regulating.'
        : scores.primary === 'fearful'
          ? 'You may move toward connection and then away from it when vulnerability begins to feel unsafe. Both impulses can be sincere, even when the shifts are confusing.'
          : 'You generally have access to direct communication and repair, though stress can still pull you toward pursuit, withdrawal, or over-functioning.';
    drawParagraph(page, cycle, body, { x: MARGIN, y: CONTENT_TOP - 6, width: CONTENT_WIDTH, size: 11, lineHeight: 17, color: muted });
    const steps = [
      ['1', 'Notice', 'Name the body cue before acting: tight chest, racing thoughts, numbness, irritation, or the urge to disappear.'],
      ['2', 'Regulate', 'Create enough steadiness to choose your response. Slow breathing, movement, grounding, or a clearly timed pause can help.'],
      ['3', 'Clarify', 'Separate observable facts from the meaning your attachment system added.'],
      ['4', 'Request', 'Make one specific request that respects both people\'s boundaries.'],
      ['5', 'Return', 'Complete repair by returning, listening, and updating the relationship with what you learned.'],
    ];
    let y = 486;
    for (const [number, title, text] of steps) {
      page.drawCircle({ x: MARGIN + 16, y: y + 4, size: 16, color: number === '5' ? navy : rose });
      const numberWidth = bodyBold.widthOfTextAtSize(number, 10);
      page.drawText(number, { x: MARGIN + 16 - numberWidth / 2, y, size: 10, font: bodyBold, color: white });
      page.drawText(title, { x: MARGIN + 48, y: y + 3, size: 12, font: bodyBold, color: charcoal });
      const bodyY = drawParagraph(page, text, body, { x: MARGIN + 125, y: y + 3, width: CONTENT_WIDTH - 125, size: 10, lineHeight: 15, color: muted });
      y = Math.min(y - 70, bodyY - 25);
    }
  }

  {
    const page = addPage('Your growth plan', 'From awareness to choice');
    const actions = [...new Set([...primary.growth, ...(scores.isBlend ? secondary.growth.slice(0, 2) : [])])].slice(0, 6);
    let y = CONTENT_TOP - 4;
    actions.forEach((action, index) => {
      page.drawCircle({ x: MARGIN + 17, y: y + 3, size: 16, color: index % 2 ? navy : rose });
      const number = String(index + 1);
      const numberWidth = bodyBold.widthOfTextAtSize(number, 10);
      page.drawText(number, { x: MARGIN + 17 - numberWidth / 2, y: y - 1, size: 10, font: bodyBold, color: white });
      y = drawParagraph(page, action, body, { x: MARGIN + 50, y: y + 5, width: CONTENT_WIDTH - 50, size: 10.5, lineHeight: 16, color: charcoal }) - 27;
    });
    drawCallout(page, 'Choose one small experiment', 'Secure attachment grows through repeated experiences, not perfect performance. Choose one practice above and repeat it for the next two weeks. Track what changes in your body, your assumptions, and your conversations.', 88, 126);
  }

  {
    const page = addPage('Reflection prompts', 'Make this profile yours');
    const prompts = [
      'What part of this profile felt immediately familiar?',
      'What protective behavior makes sense when you consider what it has been trying to prevent?',
      'Which relationship need is hardest for you to name directly?',
      'What does a safe pause during conflict look and sound like for you?',
      'What is one sign that you are moving toward greater security?',
    ];
    let y = CONTENT_TOP - 4;
    prompts.forEach((prompt, index) => {
      page.drawText(`${index + 1}.`, { x: MARGIN, y, size: 10, font: bodyBold, color: rose });
      const promptBottom = drawParagraph(page, prompt, bodyBold, { x: MARGIN + 25, y, width: CONTENT_WIDTH - 25, size: 10, lineHeight: 15, color: charcoal });
      page.drawLine({ start: { x: MARGIN + 25, y: promptBottom - 8 }, end: { x: PAGE_WIDTH - MARGIN, y: promptBottom - 8 }, thickness: 0.6, color: rule });
      page.drawLine({ start: { x: MARGIN + 25, y: promptBottom - 31 }, end: { x: PAGE_WIDTH - MARGIN, y: promptBottom - 31 }, thickness: 0.6, color: rule });
      y = promptBottom - 57;
    });
    page.drawRectangle({ x: MARGIN, y: 54, width: CONTENT_WIDTH, height: 92, color: white, borderColor: rule, borderWidth: 0.7 });
    page.drawText('Important', { x: MARGIN + 18, y: 119, size: 10.5, font: bodyBold, color: navy });
    drawParagraph(page, 'This profile is an educational self-reflection tool. It is not a clinical assessment, diagnosis, or substitute for mental health care. Attachment patterns can vary across relationships and over time. If this material raises distress or safety concerns, consider speaking with a qualified mental health professional.', body, { x: MARGIN + 18, y: 99, width: CONTENT_WIDTH - 36, size: 8.3, lineHeight: 12.5, color: muted });
  }

  const total = pdf.getPageCount();
  pdf.getPages().forEach((page, index) => {
    if (index === 0) return;
    page.drawLine({ start: { x: MARGIN, y: 45 }, end: { x: PAGE_WIDTH - MARGIN, y: 45 }, thickness: 0.5, color: rule });
    page.drawText('SECURELY LOVED  |  Personalized Attachment Profile', { x: MARGIN, y: 27, size: 7.2, font: body, color: muted });
    drawRightText(page, `${index + 1} / ${total}`, body, 7.2, PAGE_WIDTH - MARGIN, 27, muted);
  });

  return pdf.save();
}
