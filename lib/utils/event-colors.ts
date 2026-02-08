export const typeColors: Record<string, string> = {
  hackathon:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  networking:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  conference:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  pitch:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  demoday:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  workshop:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  other:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const featuredBarColors = [
  "bg-rose-300 dark:bg-rose-700",
  "bg-sky-300 dark:bg-sky-700",
  "bg-amber-300 dark:bg-amber-700",
  "bg-emerald-300 dark:bg-emerald-700",
  "bg-violet-300 dark:bg-violet-700",
  "bg-fuchsia-300 dark:bg-fuchsia-700",
];

export function getFeaturedBarColor(index: number): string {
  return featuredBarColors[index % featuredBarColors.length]!;
}
