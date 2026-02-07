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
  "bg-rose-200 dark:bg-rose-800",
  "bg-sky-200 dark:bg-sky-800",
  "bg-amber-200 dark:bg-amber-800",
  "bg-emerald-200 dark:bg-emerald-800",
  "bg-violet-200 dark:bg-violet-800",
  "bg-fuchsia-200 dark:bg-fuchsia-800",
];

export function getFeaturedBarColor(index: number): string {
  return featuredBarColors[index % featuredBarColors.length]!;
}
