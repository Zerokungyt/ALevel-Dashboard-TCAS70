export function percentageRange(count, total) {
  return count ? { min: count.min / total * 100, max: count.max / total * 100, kind: 'derived-from-official' } : null;
}

export function scoreBounds(count, formats) {
  const allocate = (questionCount, descending) => {
    let remaining = questionCount;
    let points = 0;
    const sorted = [...formats].sort((a, b) => descending ? b.pointsPerQuestion - a.pointsPerQuestion : a.pointsPerQuestion - b.pointsPerQuestion);
    for (const format of sorted) {
      const used = Math.min(remaining, format.count);
      points += used * format.pointsPerQuestion;
      remaining -= used;
    }
    if (remaining !== 0) throw new Error('Group count exceeds exam total.');
    return Math.round(points * 1e8) / 1e8;
  };
  return { min: allocate(count.min, false), max: allocate(count.max, true) };
}

export function rankGroups(groups, total) {
  for (const group of groups) group.weightMidpoint = group.questionCount ? (group.questionCount.min + group.questionCount.max) / 2 / total * 100 : null;
  for (const group of groups) group.rank = group.weightMidpoint === null ? null : 1 + groups.filter(other => other.weightMidpoint !== null && other.weightMidpoint > group.weightMidpoint + 1e-9).length;
}
