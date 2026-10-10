export function percentageRange(count: { min: number; max: number } | null, total: number): { min: number; max: number; kind: string } | null;
export function scoreBounds(count: { min: number; max: number }, formats: { count: number; pointsPerQuestion: number }[]): { min: number; max: number };
export function rankGroups(groups: { questionCount: { min: number; max: number } | null; weightMidpoint?: number | null; rank?: number | null }[], total: number): void;
