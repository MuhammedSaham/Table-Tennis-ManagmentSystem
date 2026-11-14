export type TournamentEffectiveStatus =
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export interface TournamentDateStatusInput {
  status?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

/**
 * Computes the real-world effective status of a tournament based on dates and admin status.
 *
 * Rules:
 * 1. If admin explicitly cancelled it -> "CANCELLED"
 * 2. If admin explicitly marked it completed -> "COMPLETED"
 * 3. If the tournament end date has passed (past today's end-of-day) -> "COMPLETED"
 * 4. If current time is on or between startDate (start of day) and endDate (end of day) -> "ONGOING"
 * 5. If startDate is in the future -> "UPCOMING"
 * 6. Fallback to raw status or "UPCOMING"
 */
export function getEffectiveTournamentStatus(
  t?: TournamentDateStatusInput | null,
): TournamentEffectiveStatus {
  if (!t) return "UPCOMING";

  const rawStatus = (t.status || "").toUpperCase();

  // Explicit cancellations always stay cancelled
  if (rawStatus === "CANCELLED") return "CANCELLED";

  // Explicit admin completion always stays completed
  if (rawStatus === "COMPLETED") return "COMPLETED";

  const now = new Date();

  const start = t.startDate ? new Date(t.startDate) : null;
  const end = t.endDate ? new Date(t.endDate) : null;

  const hasValidEnd = end && !Number.isNaN(end.getTime());
  const hasValidStart = start && !Number.isNaN(start.getTime());

  // Check if end date has passed (use 23:59:59.999 of the end date so it doesn't end prematurely)
  if (hasValidEnd) {
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    if (now.getTime() > endOfDay.getTime()) {
      return "COMPLETED";
    }
  }

  // Check if start date has arrived
  if (hasValidStart) {
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);

    // If today is on or after the start date and end date hasn't passed
    if (now.getTime() >= startOfDay.getTime()) {
      return "ONGOING";
    }

    // Start date is strictly in the future
    return "UPCOMING";
  }

  // Fallback to raw status if valid enum, otherwise default UPCOMING
  if (rawStatus === "ONGOING") return "ONGOING";
  return "UPCOMING";
}

/**
 * Helper to get status badge Tailwind classes
 */
export function getTournamentStatusBadgeClass(
  status?: TournamentEffectiveStatus | string | null,
): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "UPCOMING":
      return "bg-sky-500/20 text-sky-300 border border-sky-400/30";
    case "ONGOING":
      return "bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse";
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
    case "CANCELLED":
      return "bg-rose-500/20 text-rose-300 border border-rose-400/30";
    default:
      return "bg-white/10 text-white/80 border border-white/20";
  }
}

