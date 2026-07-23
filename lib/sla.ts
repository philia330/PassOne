export type SlaSeverity = "normal" | "warning" | "critical";

export function getSlaSeverity(createdAt: Date, warningDays = 2, criticalDays = 5): SlaSeverity {
  const daysPending = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysPending >= criticalDays) return "critical";
  if (daysPending >= warningDays) return "warning";
  return "normal";
}

export function getDaysPending(createdAt: Date): number {
  return Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
}

export const SLA_COLORS: Record<SlaSeverity, { bg: string; text: string; dot: string; label: string }> = {
  normal: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Baru" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Perlu Perhatian" },
  critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Mendesak" },
};