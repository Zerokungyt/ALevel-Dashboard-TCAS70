import { useState } from 'react';
import rawData from '../public/blueprint.json';
import type { Dataset, Range, Subject } from './types';
import { visibleGroups, visibleSubjects } from './selectors';

const data = rawData as unknown as Dataset;
const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 1 });
const range = (r: Range | null, suffix = '') => r ? `${fmt.format(r.min)}${r.min === r.max ? '' : `–${fmt.format(r.max)}`}${suffix}` : 'ไม่ระบุ';
const date = (s: string) => new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(`${s}T00:00:00+07:00`));
const symbols: Record<string, string> = { Physics: 'φ', Chemistry: 'Ch', Biology: 'Bio', Math1: 'M₁', Math2: 'M₂', Thai: 'ก', Social: 'Soc', English: 'En' };
const categories = [['all', 'ทุกวิชา'], ['science', 'วิทยาศาสตร์'], ['math', 'คณิตศาสตร์'], ['language', 'ภาษา'], ['social', 'สังคมศึกษา']];

function SubjectCard({ subject, selected, onSelect }: { subject: Subject; selected: boolean; onSelect: () => void }) {
  const leaders = subject.groups.filter(g => g.rank === 1);
  const leader = leaders[0];
  return <button className={`subject-card ${selected ? 'selected' : ''}`} onClick={onSelect} aria-pressed={selected} aria-controls="subject-detail">
    <span className="card-top"><span className="subject-symbol">{symbols[subject.id]}</span><span className="subject-code">A-Level {subject.code}</span><span className="card-arrow" aria-hidden="true">↗</span></span>
    <strong>{subject.nameTh}</strong><span className="english-name" lang="en">{subject.nameEn}</span>
    <span className="card-stats"><span><b>{subject.totalQuestions}</b> ข้อ</span><span>{subject.durationMinutes} นาที</span><span>{subject.totalScore} คะแนน</span></span>
    <span className="card-weight"><span>{!leader ? 'สัดส่วนรายหมวด' : leaders.length === subject.groups.length ? 'น้ำหนักเท่ากันทุกหมวด' : 'หมวดน้ำหนักสูงสุด'}</span><b>{range(leader?.percentage ?? null, '%')}</b></span>
    <span className="card-leading">{!leader ? 'ทางการไม่ระบุจำนวนข้อรายหมวด' : leaders.length === subject.groups.length ? `${leaders.length} หมวด · อันดับร่วม` : leaders.map(g => g.name).join(' / ')}</span>
  </button>;
}

function SubjectDetail({ subject, query }: { subject: Subject; query: string }) {
  const groups = visibleGroups(subject, query);
  const scoreExact = subject.id === 'English' || subject.id === 'Social';
  const noWeights = subject.groups.every(g => g.questionCount === null);
  const tied = subject.groups.every(g => g.rank === 1);
  return <section id="subject-detail" className="subject-detail" aria-labelledby="detail-title">
    <header className="detail-header"><div><span className="section-kicker">SUBJECT BLUEPRINT / {subject.code}</span><h2 id="detail-title">{subject.nameTh}<span lang="en">{subject.nameEn}</span></h2></div><a className="source-link" href={subject.source.url} target="_blank" rel="noopener noreferrer">Blueprint ทางการ <span aria-hidden="true">↗</span></a></header>
    <div className="detail-stats"><div><span>ข้อสอบทั้งหมด</span><strong>{subject.totalQuestions}<small> ข้อ</small></strong></div><div><span>คะแนนเต็ม</span><strong>{subject.totalScore}<small> คะแนน</small></strong></div><div><span>เวลาสอบ</span><strong>{subject.durationMinutes}<small> นาที</small></strong></div><div><span>หมวดเนื้อหา</span><strong>{subject.groups.length}<small> หมวด</small></strong></div></div>
    {noWeights && <div className="notice"><strong>ภาษาไทย: ทางการไม่ระบุจำนวนข้อแยกตามหมวด</strong><p>ดูบทเรียนได้ครบทั้ง 4 หมวด แต่ยังคำนวณสัดส่วน คะแนนรายหมวด และอันดับไม่ได้ ข้อมูลที่ไม่ระบุจะแสดงเป็น “ไม่ระบุ”</p></div>}
    <div className="analysis-grid">
      <div className="chart-panel"><div className="panel-heading"><h3>น้ำหนักข้อสอบรายหมวด</h3><span className="tag">% ของ {subject.totalQuestions} ข้อ</span></div>
        <p className="muted chart-description">{noWeights ? 'ไม่มีข้อมูลจำนวนข้อสำหรับสร้างกราฟ' : 'แถบทึบ = สัดส่วนขั้นต่ำ · แถบอ่อน = ช่วงถึงค่าสูงสุด'}</p>
        {!noWeights && <><div className="chart-axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div><div className="weight-chart" role="list" aria-label="สัดส่วนจำนวนข้อแต่ละหมวด เรียงตามน้ำหนัก">
          {groups.map(g => <div className="chart-row" role="listitem" key={g.id}><div className="chart-label"><span>{g.name}</span><b>{range(g.percentage, '%')}</b></div><div className="bar-track" aria-hidden="true"><div className="bar-max" style={{ width: `${g.percentage!.max}%` }} /><div className="bar-min" style={{ width: `${g.percentage!.min}%` }} /></div></div>)}
        </div></>}
        {noWeights && <div className="unavailable-chart"><span aria-hidden="true">—</span><p>ไม่มีการประมาณสัดส่วนขึ้นเอง</p></div>}
      </div>
      <aside className="format-panel"><h3>โครงสร้างคะแนนทั้งฉบับ</h3><div className="formats">{subject.formats.map(f => <div className="format-row" key={f.label}><span>{f.label}</span><div><strong>{f.count} ข้อ</strong><span>{fmt.format(f.totalScore)} คะแนน</span></div></div>)}</div><p className="format-note">{scoreExact ? 'คะแนนรายหมวดในตารางเป็นตัวเลขที่ทางการประกาศ' : noWeights ? 'ทราบคะแนนรวมทั้งฉบับ แต่ไม่มีคะแนนรายหมวดที่ทางการประกาศ' : 'คะแนนรายหมวดเป็นช่วงคำนวณจากจำนวนข้อและคะแนนต่อรูปแบบ เพราะทางการไม่ระบุรูปแบบข้อสอบในแต่ละหมวด'}</p><span className="verified-note"><span className="status-dot" />{subject.source.status === 'verified' ? 'ตรวจสอบแหล่งทางการ' : 'ยังไม่ได้ตรวจสอบ'} · {date(subject.source.verifiedAt)}</span></aside>
    </div>
    <div className="topic-panel"><div className="panel-heading"><h3>หมวดและบทเรียน{tied ? ' · น้ำหนักเท่ากัน' : ' · เรียงตามน้ำหนักข้อสอบ'}</h3><span className="muted">{groups.length} / {subject.groups.length} หมวด</span></div>
      <p className="table-note">จำนวนข้อรายหมวดมาจากทางการ · เปอร์เซ็นต์คำนวณจากจำนวนข้อ · เปิดชื่อหมวดเพื่อดูบทเรียน</p>
      <p className="scroll-hint">เลื่อนตารางไปทางขวาเพื่อดูจำนวนข้อ สัดส่วน และคะแนน →</p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label={`ตารางน้ำหนักข้อสอบ${subject.nameTh} เลื่อนแนวนอนได้`}><table><caption className="sr-only">น้ำหนักข้อสอบและคะแนนที่ครอบคลุมของ{subject.nameTh}</caption><thead><tr><th scope="col">อันดับ</th><th scope="col">หมวดเนื้อหา / บทเรียนย่อย</th><th scope="col">ข้อขั้นต่ำ–สูงสุด</th><th scope="col">สัดส่วนข้อสอบ</th><th scope="col">คะแนนที่ครอบคลุม</th></tr></thead><tbody>{groups.map(g => <tr key={g.id}><td><span className={`rank ${g.rank === 1 ? 'rank-first' : ''}`}>{g.rank ?? '—'}</span></td><td><details><summary><strong>{g.name}</strong><span>{g.subtopics.length} บทเรียน <span aria-hidden="true">⌄</span></span></summary><div className="subtopic-list"><ul>{g.subtopics.map((t, i) => <li key={`${g.id}-${i}`}>{t.name}</li>)}</ul><p>ทางการไม่ระบุจำนวนข้อ สัดส่วน หรือคะแนนแยกตามบท</p></div></details></td><td><strong>{range(g.questionCount)}</strong><small>{g.questionCount ? 'ข้อ · ทางการ' : 'ทางการไม่ระบุ'}</small></td><td><strong>{range(g.percentage, '%')}</strong><small>{g.percentage ? 'คำนวณจากจำนวนข้อ' : 'คำนวณไม่ได้'}</small></td><td><strong>{range(g.scoreCoverage)}</strong><small>{g.scoreCoverage?.kind === 'official' ? 'คะแนน · ทางการ' : g.scoreCoverage ? 'คะแนน · ช่วงคำนวณ' : 'คำนวณไม่ได้'}</small></td></tr>)}</tbody></table></div>
      <div className="table-footnote">{!noWeights && <p>อันดับใช้ค่ากลางของช่วงสัดส่วนภายในวิชา; ค่าเท่ากันได้อันดับร่วม ไม่ใช่อันดับความง่ายหรือคะแนนต่อชั่วโมงอ่าน</p>}{subject.notes.map(note => <p key={note}>{note}</p>)}{!scoreExact && !noWeights && <p>คะแนนที่ครอบคลุมเป็นขอบเขตเมื่อทำถูกเต็มทุกข้อในหมวด ไม่ใช่คะแนนที่คาดว่าจะได้ และไม่ควรนำคะแนนหลายหมวดมาบวกซ้ำในข้อบูรณาการ</p>}</div>
    </div>
  </section>;
}

export default function App() {
  const [selectedId, setSelectedId] = useState('Physics');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const subjects = visibleSubjects(data.subjects, category, query);
  const selected = subjects.find(s => s.id === selectedId) ?? subjects[0];
  const reset = () => { setQuery(''); setCategory('all'); };
  return <>
    <a className="skip-link" href="#main">ข้ามไปยังเนื้อหา</a>
    <header className="topbar"><a className="brand" href={import.meta.env.BASE_URL} aria-label="A-Level Exam Weight Dashboard หน้าหลัก"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>A-Level<span className="brand-sub">EXAM WEIGHT DASHBOARD</span></span></a><div className="header-right"><span className="year-badge">TCAS70</span><a href={data.sourceIndex} target="_blank" rel="noopener noreferrer">myTCAS <span aria-hidden="true">↗</span></a></div></header>
    <main id="main" className="container">
      <div className="page-heading"><div><div className="section-kicker">A-LEVEL / TCAS70</div><h1>อ่านให้ตรงจุด<span>เห็นน้ำหนักข้อสอบก่อนเริ่มอ่าน</span></h1><p>เปรียบเทียบหมวดเนื้อหาทั้ง 8 วิชา จาก Blueprint ทางการ</p></div><div className="data-status"><span className="status-dot" /><span>ตรวจสอบข้อมูลแล้ว 8 วิชา<small>{date(data.verifiedAt)}</small></span></div></div>
      <section className="subject-section" aria-labelledby="subjects-title"><div className="overview-heading"><h2 id="subjects-title">เลือกวิชาที่ต้องการดู</h2><a className="json-link" href={`${import.meta.env.BASE_URL}blueprint.json`} download>ข้อมูล JSON <span aria-hidden="true">↓</span></a></div>
        <div className="controls"><div className="filter-buttons" role="group" aria-label="กรองกลุ่มวิชา">{categories.map(([id, label]) => <button key={id} aria-pressed={category === id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}>{label}</button>)}</div><div className="search-box"><label className="sr-only" htmlFor="chapter-search">ค้นหาวิชา หมวด หรือบทเรียน</label><span aria-hidden="true">⌕</span><input id="chapter-search" type="search" placeholder="ค้นหาวิชา หมวด หรือบทเรียน…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="ล้างคำค้นหา">×</button>}</div></div>
        <p className="sr-only" aria-live="polite">พบ {subjects.length} วิชา{query ? ` สำหรับ ${query}` : ''}</p>
        <div className="subject-grid">{subjects.map(subject => <SubjectCard key={subject.id} subject={subject} selected={subject.id === selected?.id} onSelect={() => setSelectedId(subject.id)} />)}</div>
        {!subjects.length && <div className="empty-state"><h3>ไม่พบวิชาหรือบทเรียนที่ตรงกับคำค้นหา</h3><p>ลองค้นหาชื่อหมวดหรือบทเรียน เช่น “ไฟฟ้า” “พันธุศาสตร์” หรือ “สถิติ”</p><button onClick={reset}>ล้างการค้นหาและตัวกรอง</button></div>}
      </section>
      {selected && <SubjectDetail key={selected.id} subject={selected} query={query} />}
      <section className="methodology"><details><summary>แหล่งข้อมูลและวิธีคำนวณ <span aria-hidden="true">＋</span></summary><div className="method-content"><dl><dt>สัดส่วนข้อสอบ</dt><dd>{data.methodology.percentage}</dd><dt>การจัดอันดับ</dt><dd>{data.methodology.ranking}</dd><dt>คะแนนที่ครอบคลุม</dt><dd>{data.methodology.scoreCoverage} {data.methodology.scoreLimit}</dd><dt>ข้อมูลที่ไม่ระบุ</dt><dd>{data.methodology.subtopics} {data.methodology.missing}</dd></dl><div className="sources-list"><h3>Blueprint ที่ใช้ตรวจสอบทั้ง 8 วิชา</h3>{data.subjects.map(s => <a key={s.id} href={s.source.url} target="_blank" rel="noopener noreferrer">{s.nameTh}<small>{date(s.source.verifiedAt)} · {s.source.status === 'verified' ? 'ตรวจสอบแล้ว' : 'ยังไม่ได้ตรวจสอบ'}</small><span aria-hidden="true">↗</span></a>)}</div></div></details></section>
      <footer><span>A-Level Exam Weight Dashboard — TCAS70</span><p>{data.methodology.disclaimer}</p></footer>
    </main>
  </>;
}
