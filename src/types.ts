export interface Range {
  min: number;
  max: number;
  kind: 'official' | 'derived-from-official' | 'derived-bound';
}
export interface Group {
  id: string;
  order: number;
  name: string;
  subtopics: { name: string; questionCount: null; percentage: null; scoreCoverage: null; status: 'not-published' }[];
  questionCount: Range | null;
  percentage: Range | null;
  officialScore: number | null;
  scoreCoverage: Range | null;
  weightMidpoint: number | null;
  rank: number | null;
}
export interface Subject {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  totalQuestions: number;
  totalScore: number;
  durationMinutes: number;
  formats: { label: string; count: number; totalScore: number; pointsPerQuestion: number }[];
  groups: Group[];
  source: { url: string; verifiedAt: string; status: 'verified' | 'unverified'; htmlSha256: string };
  notes: string[];
}
export interface Dataset {
  title: string;
  examYear: string;
  verifiedAt: string;
  sourceIndex: string;
  methodology: Record<string, string>;
  subjects: Subject[];
}
