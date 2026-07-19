export function sortByRelevance<T>(
  items: T[],
  query: string,
  getName: (item: T) => string
): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;

  return [...items].sort((a, b) => {
    const aName = getName(a).toLowerCase();
    const bName = getName(b).toLowerCase();
    const aScore = aName.startsWith(q) ? 0 : aName.includes(q) ? 1 : 2;
    const bScore = bName.startsWith(q) ? 0 : bName.includes(q) ? 1 : 2;
    if (aScore !== bScore) return aScore - bScore;
    return aName.localeCompare(bName, 'ar', { numeric: true, sensitivity: 'base' });
  });
}
