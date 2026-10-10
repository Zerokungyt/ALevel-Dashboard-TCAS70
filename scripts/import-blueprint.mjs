import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { scoreBounds, rankGroups, percentageRange } from './metrics.mjs';

const root = resolve(import.meta.dirname, '..');
const subjects = [
  ['Physics', '64', 'phy', 'ฟิสิกส์', 'Physics'],
  ['Chemistry', '65', 'chem', 'เคมี', 'Chemistry'],
  ['Biology', '66', 'bio', 'ชีววิทยา', 'Biology'],
  ['Math1', '61', 'math1', 'คณิตศาสตร์ประยุกต์ 1', 'Mathematics 1'],
  ['Math2', '62', 'math2', 'คณิตศาสตร์ประยุกต์ 2', 'Mathematics 2'],
  ['Thai', '81', 'thai', 'ภาษาไทย', 'Thai Language'],
  ['Social', '70', 'soc', 'สังคมศึกษา', 'Social Studies'],
  ['English', '82', 'eng', 'ภาษาอังกฤษ', 'English'],
];
const clean = s => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '–').replace(/\s+/g, ' ').trim();
const verifiedAt = process.env.BLUEPRINT_VERIFIED_AT ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) throw new Error('Use ISO date for BLUEPRINT_VERIFIED_AT');
const index = readFileSync(resolve(root, '.cache/index.html'), 'utf8');
if (!/TCAS70/.test(index)) throw new Error('Source index does not identify TCAS70. Review before importing.');
const snapshots = [];
const rows = subjects.map(([id, code, slug, nameTh, nameEn]) => {
  const html = readFileSync(resolve(root, `.cache/a-level-${code}-${slug}.html`), 'utf8');
  const start = html.indexOf('<h2 class="stt-title">');
  const end = html.indexOf('ตัวอย่างข้อสอบ', start);
  if (start < 0 || end < 0) throw new Error(`Missing blueprint structure: ${id}`);
  const structure = html.slice(start, end);
  const section = structure.match(/<ul class="stt-body">([\s\S]*?)<\/ul>/)?.[1];
  if (!section) throw new Error(`Missing topic list: ${id}`);
  const groups = [...section.matchAll(/<li>([\s\S]*?)<\/li>/g)].flatMap(([, body]) => {
    const title = body.match(/<h3[^>]*>(ส่วนที่\s*(\d+)\s*[:：][\s\S]*?)<\/h3>/);
    if (!title) return [];
    const groupName = clean(title[1]).replace(/^ส่วนที่\s*\d+\s*[:：]\s*/, '').replace(/\s*\(\d+\s*คะแนน\)$/, '');
    const count = body.match(/class="num"[^>]*>[\s\S]*?<b>(\d+)\s*(?:[-–]\s*(\d+))?\s*<\/b>/);
    const score = clean(title[1]).match(/\((\d+)\s*คะแนน\)/);
    return [{
      id: `${id.toLowerCase()}-${title[2]}`,
      order: Number(title[2]),
      name: groupName,
      subtopics: [...body.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map(([, s]) => ({ name: clean(s).replace(/^\d+\)\s*/, ''), questionCount: null, percentage: null, scoreCoverage: null, status: 'not-published' })),
      questionCount: count ? { min: Number(count[1]), max: Number(count[2] ?? count[1]), kind: 'official' } : null,
      officialScore: score ? Number(score[1]) : null,
    }];
  });
  const countSummary = structure.match(/<div class="stt-groupnums">([\s\S]*?)<div class="stt-total">/)?.[1] ?? '';
  const formats = [...countSummary.matchAll(/<div class="stt-groupnum">\s*<div class="text">([\s\S]*?)<\/div>\s*<div class="num">\s*<b>(\d+)<\/b>/g)].map(([, text, count]) => {
    const score = clean(text).match(/\/\s*([\d.]+)\s*คะแนน/);
    if (!score) throw new Error(`Missing score summary: ${id}`);
    return { label: clean(text).replace(/\s*\/.*$/, ''), count: Number(count), totalScore: Number(score[1]), pointsPerQuestion: Number(score[1]) / Number(count) };
  });
  const totalMatch = countSummary.match(/_heading"><b>รวม<\/b>[\s\S]*?<b>(\d+)<\/b>/);
  const thaiTotal = structure.match(/จำนวนข้อ<\/[^>]+>[\s\S]*?<b>(\d+)<\/b>/);
  const totalQuestions = Number(totalMatch?.[1] ?? thaiTotal?.[1]);
  const durationMinutes = Number(clean(structure).match(/ระยะเวลาที่ใช้สอบ\s*(\d+)\s*นาที/)?.[1]);
  const totalScore = Number(structure.match(/คะแนนเต็ม<\/div>\s*<div class="num">\s*<b>(\d+)<\/b>/)?.[1]);
  if (!totalQuestions || !durationMinutes || !totalScore || !groups.length) throw new Error(`Incomplete official figures: ${id}`);
  if (id === 'Thai') formats.push({ label: 'ปรนัย 5 ตัวเลือก', count: totalQuestions, totalScore, pointsPerQuestion: totalScore / totalQuestions });
  // Social's format summary explicitly assigns 20 points to each topic group.
  if (id === 'Social') groups.forEach((g, i) => { g.officialScore = formats[i].totalScore; });
  for (const group of groups) {
    group.percentage = percentageRange(group.questionCount, totalQuestions);
    group.scoreCoverage = group.officialScore !== null
      ? { min: group.officialScore, max: group.officialScore, kind: 'official' }
      : group.questionCount ? { ...scoreBounds(group.questionCount, formats), kind: 'derived-bound' } : null;
  }
  rankGroups(groups, totalQuestions);
  const sourceUrl = `https://www.mytcas.com/blueprint/a-level-${code}-${slug}/`;
  const digest = createHash('sha256').update(html).digest('hex');
  snapshots.push({ subject: id, sourceUrl, verifiedAt, htmlSha256: digest, structureText: clean(structure) });
  return { id, code, nameTh, nameEn, totalQuestions, totalScore, durationMinutes, formats, groups, source: { url: sourceUrl, verifiedAt, status: 'verified', htmlSha256: digest }, notes: id === 'Thai' ? ['ทางการไม่ระบุจำนวนข้อรายหมวด จึงไม่สามารถคำนวณสัดส่วน คะแนนรายหมวด หรืออันดับได้'] : ['ช่วงจำนวนข้อแต่ละหมวดเป็นขอบเขตตาม Blueprint ไม่ควรรวมค่าต่ำสุดหรือสูงสุดเป็นจำนวนข้อทั้งฉบับ', ...(id === 'English' || id === 'Social' ? [] : ['บางข้อบูรณาการระหว่างเนื้อหา; ทางการไม่ระบุการกระจายรูปแบบข้อสอบรายหมวด'])] };
});
const data = {
  schemaVersion: 1,
  title: 'A-Level Exam Weight Dashboard — TCAS70',
  examYear: 'TCAS70',
  verifiedAt,
  sourceIndex: 'https://www.mytcas.com/blueprint/',
  methodology: {
    percentage: 'จำนวนข้อขั้นต่ำหรือสูงสุดของหมวด ÷ จำนวนข้อทั้งวิชา × 100 (คำนวณจากจำนวนข้อทางการ)',
    ranking: 'เรียงตามค่ากลางของช่วงสัดส่วนข้อสอบจากมากไปน้อยภายในวิชา; ค่าเท่ากันได้อันดับร่วม; ค่ากลางใช้เพื่อจัดลำดับ ไม่ใช่การพยากรณ์จำนวนข้อจริง',
    scoreCoverage: 'อังกฤษและสังคมใช้คะแนนรายหมวดทางการ; วิชาที่มีหลายรูปแบบคำนวณขอบเขตคะแนนเต็มโดยจัดข้อขั้นต่ำให้รูปแบบคะแนนต่อข้อต่ำสุดก่อน และข้อสูงสุดให้รูปแบบคะแนนต่อข้อสูงสุดก่อน ภายใต้จำนวนข้อแต่ละรูปแบบทั้งฉบับ',
    scoreLimit: 'ช่วงคะแนนเป็นขอบเขตเชิงคำนวณเมื่อทำถูกเต็มทุกข้อในหมวด ไม่ใช่คะแนนคาดการณ์หรือคะแนนรายหมวดที่ทางการรับรอง และไม่บวกคะแนนซ้ำจากข้อบูรณาการ',
    subtopics: 'ทางการให้จำนวนข้อเฉพาะหมวด ไม่ระบุจำนวนข้อ สัดส่วน หรือคะแนนรายบท จึงเก็บเป็น null',
    missing: 'null หมายถึงไม่ระบุ ไม่ใช่ศูนย์; ภาษาไทยไม่มีอันดับรายหมวด',
    disclaimer: 'Blueprint เป็นแนวทางเตรียมสอบ รายละเอียดข้อสอบจริงอาจแตกต่างจากตัวอย่าง; Dashboard นี้ไม่ใช่เว็บไซต์ของ ทปอ.',
  },
  subjects: rows,
};
writeFileSync(resolve(root, 'public/blueprint.json'), JSON.stringify(data, null, 2) + '\n');
writeFileSync(resolve(root, 'docs/source-snapshots.json'), JSON.stringify({ index: { url: data.sourceIndex, title: 'TCAS70 EXAM BLUEPRINT & SAMPLE QUESTIONS', verifiedAt, htmlSha256: createHash('sha256').update(index).digest('hex') }, subjects: snapshots }, null, 2) + '\n');
console.log(`Imported ${rows.length} official TCAS70 blueprints; ${rows.reduce((n, s) => n + s.groups.length, 0)} groups.`);
