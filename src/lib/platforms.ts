export const PLATFORMS = [
  { id: "x", label: "X (Twitter)", short: "X" },
  { id: "linkedin", label: "LinkedIn", short: "in" },
  { id: "facebook", label: "Facebook Pages", short: "fb" },
  { id: "instagram", label: "Instagram", short: "ig" },
  { id: "reddit", label: "Reddit", short: "r/" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}
