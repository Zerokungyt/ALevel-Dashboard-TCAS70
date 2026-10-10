import type { Group, Subject } from './types.ts';

export const subjectCategories: Record<string, string[]> = {
  all: ['Physics', 'Chemistry', 'Biology', 'Math1', 'Math2', 'Thai', 'Social', 'English'],
  science: ['Physics', 'Chemistry', 'Biology'],
  math: ['Math1', 'Math2'],
  language: ['Thai', 'English'],
  social: ['Social'],
};
const normalize = (s: string) => s.normalize('NFC').toLocaleLowerCase().trim();
export function groupMatches(group: Group, query: string): boolean {
  const term = normalize(query);
  return !term || [group.name, ...group.subtopics.map(topic => topic.name)].some(s => normalize(s).includes(term));
}
export function subjectMatches(subject: Subject, query: string): boolean {
  const term = normalize(query);
  return !term || [subject.id, subject.code, subject.nameTh, subject.nameEn].some(s => normalize(s).includes(term));
}
export function visibleGroups(subject: Subject, query: string): Group[] {
  return subject.groups.filter(group => subjectMatches(subject, query) || groupMatches(group, query)).sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.order - b.order);
}
export function visibleSubjects(subjects: Subject[], category: string, query: string): Subject[] {
  return subjects.filter(subject => (subjectCategories[category] ?? []).includes(subject.id) && (subjectMatches(subject, query) || subject.groups.some(group => groupMatches(group, query))));
}
