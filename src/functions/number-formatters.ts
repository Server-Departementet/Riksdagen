
const truncationTable = {
  1e3: 't', // Tusen
  1e6: 'M', // Miljon
  1e9: 'Md', // Miljard
  1e12: 'B', // Biljon
  1e15: 'Bd', // Biljard
};

export function truncateNumber(num: number): string {
  for (const [value, suffix] of Object.entries(truncationTable).reverse()) {
    const numericValue = Number(value);
    if (num >= numericValue) {
      const truncated = (num / numericValue).toFixed(1).replace(/\.0$/, '');
      return `${truncated}${suffix}`;
    }
  }
  return num.toString();
}