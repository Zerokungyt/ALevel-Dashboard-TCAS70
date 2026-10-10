import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pagesBase } from '../src/base-path.ts';
import { visibleSubjects, visibleGroups } from '../src/selectors.ts';
import type { Dataset } from '../src/types.ts';

const data: Dataset = JSON.parse(readFileSync(new URL('../public/blueprint.json', import.meta.url), 'utf8'));

test('Pages base follows repository identity, including renamed repositories and user sites', () => {
  assert.equal(pagesBase('Zerokungyt/ALevelDashboard'), '/ALevelDashboard/');
  assert.equal(pagesBase('Zerokungyt/ALevel-Dashboard-TCAS70'), '/ALevel-Dashboard-TCAS70/');
  assert.equal(pagesBase('owner/renamed-dashboard'), '/renamed-dashboard/');
  assert.equal(pagesBase('owner/owner.github.io'), '/');
  assert.equal(pagesBase('owner/project', '/'), '/');
  assert.throws(() => pagesBase('owner/project', '/invalid'));
  assert.throws(() => pagesBase('owner/project', '/foo?bar/'));
});

test('Thai chapter search finds the correct subject and only relevant groups', () => {
  const subjects = visibleSubjects(data.subjects, 'all', 'ไฟฟ้า');
  assert.deepEqual(subjects.map(s => s.id), ['Physics', 'Chemistry']);
  assert.deepEqual(visibleGroups(subjects[0], 'ไฟฟ้า').map(g => g.order), [3]);
});

test('Search and subject filters intersect, and empty results stay empty', () => {
  assert.deepEqual(visibleSubjects(data.subjects, 'math', 'สถิติ').map(s => s.id), ['Math1', 'Math2']);
  assert.equal(visibleSubjects(data.subjects, 'language', 'ไฟฟ้า').length, 0);
  assert.equal(visibleSubjects(data.subjects, 'all', 'no-such-chapter-xyz').length, 0);
  assert.equal(visibleSubjects(data.subjects, 'all', ' ').length, 8);
});

test('Subject aliases are case-insensitive and preserve all groups when matched', () => {
  const subject = visibleSubjects(data.subjects, 'all', 'PHYSICS')[0];
  assert.equal(subject.id, 'Physics');
  assert.equal(visibleGroups(subject, 'PHYSICS').length, 5);
  assert.deepEqual(visibleSubjects(data.subjects, 'all', '82').map(s => s.id), ['English']);
});

test('Tied weights keep shared ranks and Thai has no fabricated values', () => {
  const social = data.subjects.find(s => s.id === 'Social')!;
  assert.ok(social.groups.every(g => g.rank === 1));
  const chemistry = data.subjects.find(s => s.id === 'Chemistry')!;
  assert.deepEqual(visibleGroups(chemistry, '').map(g => g.rank), [1, 1, 3]);
  const thai = data.subjects.find(s => s.id === 'Thai')!;
  assert.ok(thai.groups.every(g => g.rank === null && g.percentage === null && g.scoreCoverage === null));
});

test('Independent enumeration confirms score bounds with mixed question formats', async () => {
  const { scoreBounds } = await import('../scripts/metrics.mjs');
  for (const subject of data.subjects.filter(s => ['Physics', 'Chemistry', 'Biology', 'Math1', 'Math2'].includes(s.id))) {
    const [a, b] = subject.formats;
    for (const group of subject.groups) {
      const attainable: number[] = [];
      for (let count = group.questionCount!.min; count <= group.questionCount!.max; count++) {
        for (let highCount = 0; highCount <= b.count; highCount++) {
          const lowCount = count - highCount;
          if (lowCount >= 0 && lowCount <= a.count) attainable.push(lowCount * a.totalScore / a.count + highCount * b.totalScore / b.count);
        }
      }
      const bounds = scoreBounds(group.questionCount!, subject.formats);
      assert.ok(Math.abs(bounds.min - Math.min(...attainable)) < 1e-7);
      assert.ok(Math.abs(bounds.max - Math.max(...attainable)) < 1e-7);
    }
  }
});
