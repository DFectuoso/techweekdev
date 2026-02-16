export const typeColors: Record<string, string> = {
  hackathon:
    "bg-violet-100 text-violet-800",
  networking:
    "bg-blue-100 text-blue-800",
  conference:
    "bg-amber-100 text-amber-800",
  pitch:
    "bg-green-100 text-green-800",
  demoday:
    "bg-pink-100 text-pink-800",
  workshop:
    "bg-cyan-100 text-cyan-800",
  other:
    "bg-gray-100 text-gray-800",
};

const featuredBarColors = [
  "bg-rose-300",
  "bg-sky-300",
  "bg-amber-300",
  "bg-emerald-300",
  "bg-violet-300",
  "bg-fuchsia-300",
];

export function getFeaturedBarColor(index: number): string {
  return featuredBarColors[index % featuredBarColors.length]!;
}
