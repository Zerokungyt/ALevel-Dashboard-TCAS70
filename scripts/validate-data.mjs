import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { percentageRange, scoreBounds, rankGroups } from './metrics.mjs';

const root = resolve(import.meta.dirname, '..');
const data = JSON.parse(readFileSync(resolve(root, 'public/blueprint.json'), 'utf8'));
const snapshot = JSON.parse(readFileSync(resolve(root, 'docs/source-snapshots.json'), 'utf8'));
// Independently checked against each official subject page, not generated from the JSON.
const official = {
  Physics: { total: 30, topics: [8, 3, 4, 2, 2], counts: [[8, 10], [5, 7], [6, 8], [3, 5], [3, 5]], formats: [[25, 75], [5, 25]] },
  Chemistry: { total: 35, topics: [5, 5, 3], counts: [[15, 17], [15, 17], [2, 4]], formats: [[30, 75], [5, 25]] },
  Biology: { total: 40, topics: [4, 2, 9, 5, 5], counts: [[5, 7], [6, 8], [12, 14], [6, 8], [6, 8]], formats: [[35, 84], [5, 16]] },
  Math1: { total: 30, topics: [9, 2, 4, 1], counts: [[15, 17], [3, 5], [6, 8], [2, 4]], formats: [[25, 75], [5, 25]] },
  Math2: { total: 30, topics: [6, 3], counts: [[14, 16], [14, 16]], formats: [[25, 75], [5, 25]] },
  Thai: { total: 50, topics: [7, 7, 3, 10], counts: [null, null, null, null], formats: [[50, 100]] },
  Social: { total: 50, topics: [2, 2, 2, 3, 2], counts: [[10, 10], [10, 10], [10, 10], [10, 10], [10, 10]], formats: [[10, 20], [10, 20], [10, 20], [10, 20], [10, 20]] },
  English: { total: 80, topics: [2, 5, 2], counts: [[20, 20], [40, 40], [20, 20]], formats: [[20, 25], [40, 50], [20, 25]] },
};
assert.equal(data.examYear, 'TCAS70');
assert.equal(data.subjects.length, 8);
assert.equal(new Set(data.subjects.map(s => s.id)).size, 8);
assert.equal(snapshot.index.verifiedAt, data.verifiedAt);
let totalGroups = 0;
let totalSubtopics = 0;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
for (const subject of data.subjects) {
  const control = official[subject.id];
  assert.ok(control, `Unknown subject ${subject.id}`);
  assert.equal(subject.totalQuestions, control.total);
  assert.equal(subject.totalScore, 100);
  assert.equal(subject.durationMinutes, 90);
  assert.equal(subject.source.status, 'verified');
  assert.match(subject.source.url, /^https:\/\/www\.mytcas\.com\/blueprint\/a-level-\d+-[a-z0-9]+\/$/);
  assert.match(subject.source.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  const source = snapshot.subjects.find(s => s.subject === subject.id);
  assert.equal(source.htmlSha256, subject.source.htmlSha256);
  assert.equal(source.verifiedAt, subject.source.verifiedAt);
  assert.equal(source.sourceUrl, subject.source.url);
  assert.deepEqual(subject.formats.map(f => [f.count, f.totalScore]), control.formats);
  assert.equal(subject.formats.reduce((n, f) => n + f.count, 0), control.total);
  assert.equal(subject.formats.reduce((n, f) => n + f.totalScore, 0), 100);
  for (const f of subject.formats) near(f.pointsPerQuestion, f.totalScore / f.count);
  assert.equal(subject.groups.length, control.counts.length);
  const expectedRanking = structuredClone(subject.groups);
  rankGroups(expectedRanking, subject.totalQuestions);
  subject.groups.forEach((group, i) => {
    assert.equal(group.subtopics.length, control.topics[i]);
    assert.equal(group.order, i + 1);
    assert.ok(source.structureText.includes(group.name));
    for (const topic of group.subtopics) {
      assert.ok(source.structureText.includes(topic.name));
      assert.equal(topic.questionCount, null);
      assert.equal(topic.percentage, null);
      assert.equal(topic.scoreCoverage, null);
      assert.equal(topic.status, 'not-published');
    }
    const count = control.counts[i];
    if (count === null) {
      for (const field of ['questionCount', 'percentage', 'scoreCoverage', 'rank', 'weightMidpoint', 'officialScore']) assert.equal(group[field], null);
    } else {
      assert.deepEqual([group.questionCount.min, group.questionCount.max], count);
      assert.equal(group.questionCount.kind, 'official');
      assert.deepEqual(group.percentage, percentageRange(group.questionCount, subject.totalQuestions));
      assert.equal(group.rank, expectedRanking[i].rank);
      near(group.weightMidpoint, expectedRanking[i].weightMidpoint);
      assert.ok(group.scoreCoverage.min >= 0 && group.scoreCoverage.max <= 100);
      if (subject.id === 'Social' || subject.id === 'English') {
        const score = subject.id === 'Social' ? 20 : [25, 50, 25][i];
        assert.equal(group.officialScore, score);
        assert.deepEqual(group.scoreCoverage, { min: score, max: score, kind: 'official' });
      } else {
        assert.equal(group.officialScore, null);
        assert.deepEqual(group.scoreCoverage, { ...scoreBounds(group.questionCount, subject.formats), kind: 'derived-bound' });
      }
    }
    totalGroups++;
    totalSubtopics += group.subtopics.length;
  });
  if (subject.id !== 'Thai') {
    assert.ok(subject.groups.reduce((n, g) => n + g.questionCount.min, 0) <= subject.totalQuestions);
    assert.ok(subject.groups.reduce((n, g) => n + g.questionCount.max, 0) >= subject.totalQuestions);
  }
}
console.log(`Data validation passed: 8 subjects, ${totalGroups} topic groups, ${totalSubtopics} subtopics; source provenance, official counts, percentages, score bounds, ties and missing values checked.`);
