import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import EditKnockoutModal from "./EditKnockoutMatchModal";
import { AssignRefereeModal } from "./AssignRefereeModal";
import RefereeProfileCard from "./RefereeProfileCard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Player {
  id: string;
  firstName: string;
  lastName: string;
}
interface TeamMember {
  player: Player;
}
interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}
interface KnockoutMatch {
  id: string;
  round: string;
  matchNumber: number;
  matchType?: string;
  player1Id: string | null;
  player2Id: string | null;
  player1: Player | null;
  player2: Player | null;
  team1Id?: string | null;
  team2Id?: string | null;
  team1?: Team | null;
  team2?: Team | null;
  winnerId: string | null;
  winnerTeamId?: string | null;
  score: string | null;
  status: string;
  scheduledTime?: string;
  startTime?: string | null;
  endTime?: string | null;
  referee?: {
    id: string;
    user: {
      id?: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      profileImage?: string | null;
    };
  } | null;
  resultDetails?: any;
}
interface GameScore {
  p1: string;
  p2: string;
}
interface KnockoutBracketProps {
  tournamentId: string;
  categoryId: string;
  onScoreRecorded?: () => void;
  refreshTrigger?: number;
}

/** Returns a display name for a singles player slot */
const getName = (p: Player | null) =>
  p ? `${p.firstName} ${p.lastName}` : "TBD";

/** Returns "Player A / Player B" for a doubles team slot, or "TBD" if no team */
const getTeamName = (team: Team | null | undefined): string => {
  if (!team) return "TBD";
  const names = team.members.map(
    (m) => `${m.player.firstName} ${m.player.lastName}`,
  );
  return names.length > 0 ? names.join(" / ") : team.name;
};

/** Smart name: uses team members for DOUBLES, individual player for SINGLES */
const getMatchSlotName = (match: KnockoutMatch, slot: 1 | 2): string => {
  if (match.matchType === "DOUBLES") {
    return getTeamName(slot === 1 ? match.team1 : match.team2);
  }
  return getName(slot === 1 ? match.player1 : match.player2);
};
const fmtTime = (t?: string) =>
  t
    ? new Date(t).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const CW = 220;
const CH = 72;
const VGAP = 24;
const HG = 36;
const LH = 34;

// ─── Umpire Sheet ─────────────────────────────────────────────────────────────
export const UmpireSheet: React.FC<{
  match: KnockoutMatch;
  onClose: () => void;
  onSave: (
    id: string,
    games: GameScore[],
    bestOf: 3 | 5,
    startTime?: string,
    endTime?: string,
  ) => Promise<void>;
  isAdminOrReferee: boolean;
  onCorrectScore?: (
    id: string,
    games: GameScore[],
    bestOf: 3 | 5,
    reason: string,
  ) => Promise<void>;
}> = ({ match, onClose, onSave, onCorrectScore, isAdminOrReferee }) => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-GB");
  const done = match.status === "COMPLETED";
  // Only admins may edit a completed match.
  const canEditCompleted =
    (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && done;

  // Referees can only enter scores for unfinished matches.
  const canEditScore = isAdminOrReferee && (!done || canEditCompleted);

  const initBestOf = (): 3 | 5 => {
    if (
      match.resultDetails?.bestOf === 3 ||
      match.resultDetails?.bestOf === 5
    ) {
      return match.resultDetails.bestOf;
    }
    if (match.score && done && match.score !== "BYE" && match.score !== "W/O") {
      const parts = match.score.split(",").map((s) => s.trim());
      let p1Wins = 0;
      let p2Wins = 0;
      for (const p of parts) {
        const [a, b] = p.split("-").map(Number);
        if (!isNaN(a) && !isNaN(b)) {
          if (a > b) p1Wins++;
          else if (b > a) p2Wins++;
        }
      }
      const maxWins = Math.max(p1Wins, p2Wins);
      if (maxWins === 2 || (parts.length <= 3 && maxWins < 3)) {
        return 3;
      }
      if (maxWins >= 3 || parts.length > 3) {
        return 5;
      }
    }
    return 5;
  };

  const [bestOf, setBestOf] = useState<3 | 5>(initBestOf);

  const initGames = (currentBestOf: 3 | 5 = initBestOf()): GameScore[] => {
    if (match.score && done && match.score !== "BYE" && match.score !== "W/O") {
      const parts = match.score.split(",").map((s) => s.trim());
      if (parts.length > 0)
        return [
          ...parts.map((p) => {
            const n = p.split("-");
            return { p1: n[0]?.trim() ?? "", p2: n[1]?.trim() ?? "" };
          }),
          ...Array(Math.max(0, currentBestOf - parts.length)).fill({
            p1: "",
            p2: "",
          }),
        ].slice(0, currentBestOf);
    }
    return Array(currentBestOf)
      .fill(null)
      .map(() => ({ p1: "", p2: "" }));
  };

  const [games, setGames] = useState<GameScore[]>(() =>
    initGames(initBestOf()),
  );

  useEffect(() => {
    const bo = initBestOf();
    setBestOf(bo);
    setGames(initGames(bo));

    setStartTime(formatSavedTime(match.startTime));
    setEndTime(formatSavedTime(match.endTime));
  }, [match.id, match.score, match.status, match.startTime, match.endTime]);
  const [saving, setSaving] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  const formatSavedTime = (value?: string | null) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const [startTime, setStartTime] = useState(formatSavedTime(match.startTime));

  const [endTime, setEndTime] = useState(formatSavedTime(match.endTime));
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    let duration = endHour * 60 + endMinute - (startHour * 60 + startMinute);

    // Support matches ending after midnight
    if (duration < 0) {
      duration += 24 * 60;
    }

    return duration;
  };

  const matchDuration = calculateDuration();

  const [pointsToWin, setPointsToWin] = useState<number>(11);
  const targetPts =
    typeof pointsToWin === "number" && !isNaN(pointsToWin) && pointsToWin > 0
      ? pointsToWin
      : 11;

  const getGameWinner = (p1Str: string, p2Str: string): "p1" | "p2" | null => {
    if (p1Str === "" || p2Str === "") return null;
    const p1 = parseInt(p1Str);
    const p2 = parseInt(p2Str);
    if (isNaN(p1) || isNaN(p2)) return null;

    if (p1 >= targetPts && p1 - p2 >= 2) return "p1";
    if (p2 >= targetPts && p2 - p1 >= 2) return "p2";
    return null;
  };

  const isGameValid = (p1Str: string, p2Str: string): boolean => {
    if (p1Str === "" && p2Str === "") return true;
    if (p1Str === "" || p2Str === "") return false;
    const p1 = parseInt(p1Str);
    const p2 = parseInt(p2Str);
    if (isNaN(p1) || isNaN(p2)) return false;

    const winner = Math.max(p1, p2);
    const loser = Math.min(p1, p2);

    if (winner < targetPts) return false;
    if (winner === targetPts) return loser <= targetPts - 2;
    if (winner > targetPts) return loser === winner - 2;

    return false;
  };

  const wn = Math.ceil(bestOf / 2);
  const cw = (s: "p1" | "p2") =>
    games.filter((g) => getGameWinner(g.p1, g.p2) === s).length;
  const p1W = cw("p1"),
    p2W = cw("p2");
  const over = p1W >= wn || p2W >= wn;

  const needed = (idx: number) => {
    let w1 = 0,
      w2 = 0;
    for (let i = 0; i < idx; i++) {
      const g = games[i];
      const winner = getGameWinner(g.p1, g.p2);
      if (winner === "p1") w1++;
      if (winner === "p2") w2++;
    }
    return w1 < wn && w2 < wn;
  };

  const p1n = getMatchSlotName(match, 1),
    p2n = getMatchSlotName(match, 2);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
        overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          color: "#0f172a",
          borderRadius: 16,
          width: "100%",
          maxWidth: 640,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          fontFamily: "'Segoe UI',system-ui,sans-serif",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#0f172a",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "2px solid #38bdf8",
                background: "#1e3a5f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              <img
                src="/club-logo.png"
                alt="Table Tennis Club Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  color: "#38bdf8",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Sam's College
              </div>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 900 }}>
                TABLE TENNIS TOURNAMENT
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Date + round + format */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, color: "#475569" }}>
              <strong>DATE:</strong> {today}
            </span>
            <span
              style={{
                background: "#fef2f2",
                color: "#e11d48",
                fontWeight: 700,
                fontSize: 13,
                padding: "4px 12px",
                borderRadius: 20,
              }}
            >
              {match.round}
            </span>
            {!done && isAdminOrReferee ? (
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}
                  >
                    Pts to Win:
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={pointsToWin}
                    placeholder="11"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPointsToWin(!isNaN(val) && val > 0 ? val : 11);
                    }}
                    onBlur={() => {
                      if (
                        !pointsToWin ||
                        isNaN(pointsToWin) ||
                        pointsToWin < 1
                      ) {
                        setPointsToWin(11);
                      }
                    }}
                    style={{
                      width: 45,
                      padding: "4px",
                      borderRadius: 6,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center",
                      outline: "none",
                      color: "#0f172a",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}
                  >
                    Format:
                  </span>
                  {([3, 5] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setBestOf(n);
                        setGames((prev) => {
                          const next = [...prev];
                          while (next.length < n) next.push({ p1: "", p2: "" });
                          return next.slice(0, n);
                        });
                      }}
                      style={{
                        padding: "4px 14px",
                        borderRadius: 20,
                        border: "1.5px solid",
                        borderColor: bestOf === n ? "#0f172a" : "#e2e8f0",
                        background: bestOf === n ? "#0f172a" : "#fff",
                        color: bestOf === n ? "#fff" : "#64748b",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Best of {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                Best of {bestOf}
              </span>
            )}
          </div>

          {/* Optional Match Time */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
              padding: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Start Time
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={done || !canEditScore}
                style={{
                  display: "block",
                  marginTop: 5,
                  padding: 7,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                }}
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              End Time
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={done || !canEditScore}
                style={{
                  display: "block",
                  marginTop: 5,
                  padding: 7,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                }}
              />
            </label>

            <div style={{ fontSize: 13 }}>
              <strong>Duration:</strong>{" "}
              {matchDuration === null
                ? "Not entered"
                : `${Math.floor(matchDuration / 60)} hr ${matchDuration % 60} min`}
            </div>
          </div>

          {/* Live progress */}
          {!done && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#0369a1", fontWeight: 700 }}>
                {p1n}: {p1W}
              </span>
              <span style={{ color: "#64748b", margin: "0 10px" }}>vs</span>
              <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                {p2n}: {p2W}
              </span>
              {over ? (
                <span
                  style={{
                    marginLeft: 12,
                    color: "#166534",
                    fontWeight: 700,
                    background: "#dcfce7",
                    padding: "2px 10px",
                    borderRadius: 12,
                  }}
                >
                  ✓ {p1W > p2W ? p1n : p2n} wins!
                </span>
              ) : (
                <span
                  style={{ marginLeft: 12, color: "#94a3b8", fontSize: 12 }}
                >
                  First to {wn} wins
                </span>
              )}
            </div>
          )}

          {/* Score table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                      minWidth: 140,
                    }}
                  />
                  {Array.from({ length: bestOf }, (_, i) => i + 1).map((g) => (
                    <th
                      key={g}
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        border: "1px solid #e2e8f0",
                        width: 54,
                        color: needed(g - 1) ? "#0f172a" : "#cbd5e1",
                        background: needed(g - 1) ? "#fff" : "#f8fafc",
                      }}
                    >
                      Game {g}
                    </th>
                  ))}
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Match Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: p1n,
                    side: "p1" as const,
                    wins: p1W,
                    color: "#0369a1",
                  },
                  {
                    label: p2n,
                    side: "p2" as const,
                    wins: p2W,
                    color: "#b91c1c",
                  },
                ].map(({ label, side, wins, color }) => (
                  <tr key={side}>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1e293b",
                        border: "1px solid #e2e8f0",
                        background: "#fafafa",
                      }}
                    >
                      <span style={{ color, fontWeight: 700 }}>
                        {side === "p1" ? "P1" : "P2"}:
                      </span>{" "}
                      {label}
                    </td>
                    {Array.from({ length: bestOf }, (_, i) => i).map((i) => {
                      const nd = needed(i);
                      const g = games[i];
                      return (
                        <td
                          key={i}
                          style={{
                            padding: "4px 6px",
                            textAlign: "center",
                            border: "1px solid #e2e8f0",
                            background: !nd ? "#f8fafc" : "#fff",
                          }}
                        >
                          <input
                            type="number"
                            min={0}
                            value={g[side]}
                            onChange={(e) => {
                              if (!canEditScore) return;
                              const nx = [...games];
                              nx[i] = { ...nx[i], [side]: e.target.value };
                              setGames(nx);
                            }}
                            disabled={!canEditScore}
                            style={{
                              width: 42,
                              height: 36,
                              textAlign: "center",
                              border: "1.5px solid",
                              borderColor:
                                !canEditScore || !nd ? "#e2e8f0" : "#cbd5e1",
                              borderRadius: 8,
                              fontSize: 15,
                              fontWeight: 700,
                              color: !nd ? "#cbd5e1" : "#0f172a",
                              background:
                                !canEditScore || !nd ? "#f8fafc" : "#fff",
                              outline: "none",
                            }}
                            onFocus={(e) => {
                              if (nd) e.target.style.borderColor = color;
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#cbd5e1";
                            }}
                          />
                        </td>
                      );
                    })}
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        border: "1px solid #e2e8f0",
                        fontSize: 24,
                        fontWeight: 900,
                        color,
                      }}
                    >
                      {wins}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Won by + Signature */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: "#475569" }}>
              <strong>Won by:</strong>{" "}
              {p1W > p2W ? (
                <span style={{ color: "#0369a1", fontWeight: 700 }}>{p1n}</span>
              ) : p2W > p1W ? (
                <span style={{ color: "#b91c1c", fontWeight: 700 }}>{p2n}</span>
              ) : (
                <span style={{ color: "#94a3b8" }}>…………………………</span>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Scoring Referee
              </p>
              <RefereeProfileCard referee={match.referee?.user} />
            </div>
          </div>
          {done && (
            <div
              style={{
                marginTop: 14,
                background: "#dcfce7",
                color: "#166534",
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: 20,
                display: "inline-block",
              }}
            >
              ✓ Match Completed
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            background: "#f8fafc",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 10,
              background: "#fff",
              color: "#475569",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          {canEditCompleted && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Reason for correction"
                style={{
                  padding: "9px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#0f172a",
                }}
              />

              <button
                disabled={saving || !over}
                onClick={async () => {
                  if (correctionReason.trim().length < 5) {
                    toast.error(
                      "Please enter a correction reason (at least 5 characters)",
                    );
                    return;
                  }

                  for (let i = 0; i < games.length; i++) {
                    const g = games[i];

                    if (g.p1 === "" && g.p2 === "") continue;

                    if (!isGameValid(g.p1, g.p2)) {
                      toast.error(`Game ${i + 1} has an invalid score`);
                      return;
                    }
                  }

                  setSaving(true);
                  try {
                    if (onCorrectScore) {
                      await onCorrectScore(
                        match.id,
                        games,
                        bestOf,
                        correctionReason.trim(),
                      );
                    }
                  } finally {
                    setSaving(false);
                  }
                }}
                style={{
                  padding: "9px 20px",
                  border: "none",
                  borderRadius: 10,
                  background: saving || !over ? "#94a3b8" : "#0369a1",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: saving || !over ? "default" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Correction"}
              </button>
            </div>
          )}
          {isAdminOrReferee && !done && (
            <button
              onClick={async () => {
                if (Boolean(startTime) !== Boolean(endTime)) {
                  toast.error(
                    "Please enter both Start Time and End Time, or leave both empty.",
                  );
                  return;
                }
                for (let i = 0; i < games.length; i++) {
                  const g = games[i];
                  if (g.p1 === "" && g.p2 === "") continue;
                  if (!isGameValid(g.p1, g.p2)) {
                    toast.error(
                      `Game ${i + 1} has an invalid score. A game is played to ${targetPts} points and must be won by 2 clear points.`,
                    );
                    return;
                  }
                }

                if (!over) {
                  toast.error(
                    `Match not complete. ${wn} game wins needed to win.`,
                  );
                  return;
                }
                setSaving(true);
                await onSave(match.id, games, bestOf, startTime, endTime);
                setSaving(false);
              }}
              disabled={saving || !over}
              style={{
                padding: "9px 24px",
                border: "none",
                borderRadius: 10,
                background: saving || !over ? "#94a3b8" : "#0f172a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: saving || !over ? "default" : "pointer",
              }}
            >
              {saving ? "Saving…" : !over ? `Need ${wn} wins` : "Save Score"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Match Card ───────────────────────────────────────────────────────────────
// ← onEdit added to props interface
const MatchCard: React.FC<{
  match: KnockoutMatch;
  matchLabel: string;
  isAdmin: boolean;
  canRecordScore: boolean;
  onOpen: (m: KnockoutMatch) => void;
  onEdit: (m: KnockoutMatch) => void; // ← NEW
  onAssignReferee?: (m: KnockoutMatch) => void;
  accent?: string;
  cardWidth?: number;
}> = ({
  match,
  matchLabel,
  isAdmin,
  canRecordScore,
  onOpen,
  onEdit,
  onAssignReferee,
  accent,
  cardWidth = CW,
}) => {
  const isWalkover = match.status === "WALKOVER" || match.score === "W/O";
  const isBye = match.score === "BYE";
  const done = match.status === "COMPLETED" || isWalkover || isBye;
  const isDoubles = match.matchType === "DOUBLES";
  // For doubles the winnerId stores the winning team captain's userId;
  // compare against team1Id/team2Id for the highlight logic.
  const p1Won =
    done &&
    (isDoubles
      ? match.winnerId === match.team1?.id ||
        match.winnerTeamId === match.team1?.id
      : match.winnerId === match.player1?.id);
  const p2Won =
    done &&
    (isDoubles
      ? match.winnerId === match.team2?.id ||
        match.winnerTeamId === match.team2?.id
      : match.winnerId === match.player2?.id);

  const gameParts =
    match.score && match.score !== "BYE" && match.score !== "W/O"
      ? match.score.split(",").map((s) => s.trim())
      : [];
  const p1Games =
    match.score === "BYE" && p1Won
      ? "BYE"
      : isWalkover && p1Won
        ? "W/O"
        : isWalkover && !p1Won
          ? "-"
          : gameParts.filter((g) => {
              const [a, b] = g.split("-").map(Number);
              return a > b;
            }).length;
  const p2Games =
    match.score === "BYE" && p2Won
      ? "BYE"
      : isWalkover && p2Won
        ? "W/O"
        : isWalkover && !p2Won
          ? "-"
          : gameParts.filter((g) => {
              const [a, b] = g.split("-").map(Number);
              return b > a;
            }).length;

  return (
    <div
      onClick={() => !isBye && !isWalkover && onOpen(match)}
      style={{
        width: cardWidth,
        cursor: isBye || isWalkover ? "default" : "pointer",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}
      title={
        isBye
          ? "BYE — Player advances automatically"
          : isWalkover
            ? "Walkover (W/O) — Opponent advanced"
            : "Click to open umpire sheet"
      }
    >
      <div
        style={{
          border: `1.5px solid ${isBye ? "#e2e8f0" : done ? "#22c55e" : "#cbd5e1"}`,
          borderRadius: 8,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: isBye
            ? "0 1px 4px rgba(0,0,0,0.05)"
            : done
              ? "0 2px 10px rgba(34,197,94,0.16)"
              : "0 2px 8px rgba(0,0,0,0.08)",
          opacity: 1,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!isBye && !isWalkover) {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 16px rgba(74, 238, 255, 0.4)";
            (e.currentTarget as HTMLElement).style.borderColor = "#0284c7";
          }
        }}
        onMouseLeave={(e) => {
          if (!isBye && !isWalkover) {
            (e.currentTarget as HTMLElement).style.boxShadow = done
              ? "0 2px 10px rgba(34,197,94,0.16)"
              : "0 2px 8px rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = done
              ? "#22c55e"
              : "#cbd5e1";
          }
        }}
      >
        {/* Match header bar */}
        <div
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "2px 8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 20,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: isBye ? "#94a3b8" : accent ? accent : "#0284c7",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {matchLabel}
          </span>
          {isBye ? (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: "#64748b",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "1px 5px",
                borderRadius: 6,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              BYE
            </span>
          ) : (
            <>
              {match.scheduledTime && (
                <span
                  style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}
                >
                  {fmtTime(match.scheduledTime)}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {done && (
                  <span
                    style={{
                      fontSize: 8,
                      color: isWalkover ? "#b45309" : "#166534",
                      fontWeight: 800,
                      background: isWalkover ? "#fef3c7" : "#dcfce7",
                      border: `1px solid ${isWalkover ? "#fde68a" : "#86efac"}`,
                      padding: "1px 5px",
                      borderRadius: 6,
                    }}
                  >
                    {isWalkover ? "✓ W/O" : "✓ Done"}
                  </span>
                )}
                {isAdmin && !done && onAssignReferee && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignReferee(match);
                    }}
                    style={{
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      cursor: "pointer",
                      fontSize: 8,
                      color: "#0284c7",
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                    title="Assign a referee to this match"
                  >
                    Ref
                  </button>
                )}
                {isAdmin && !done && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(match);
                    }}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      cursor: "pointer",
                      fontSize: 8,
                      color: "#b91c1c",
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                    title="Declare Walkover (W/O) / No-Show"
                  >
                    W/O
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* BYE: show just the advancing player */}
        {isBye ? (
          <div
            style={{
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              height: 50,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 800,
                color: "#64748b",
                flexShrink: 0,
              }}
            >
              1
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#0f172a",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {getMatchSlotName(match, 1)}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#0284c7",
                whiteSpace: "nowrap",
              }}
            >
              → Advances
            </span>
          </div>
        ) : (
          /* Normal player rows */
          [
            { slot: 1 as const, won: p1Won, games: p1Games },
            { slot: 2 as const, won: p2Won, games: p2Games },
          ].map(({ slot, won, games: gs }) => {
            const slotName = getMatchSlotName(match, slot);
            const isFilled = isDoubles
              ? slot === 1
                ? !!match.team1
                : !!match.team2
              : slot === 1
                ? !!match.player1
                : !!match.player2;
            const idx = slot - 1;
            return (
              <div
                key={idx}
                style={{
                  padding: "3px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 25,
                  boxSizing: "border-box",
                  borderBottom: idx === 0 ? "1px solid #f1f5f9" : "none",
                  background: won ? "#f0fdf4" : "#ffffff",
                }}
              >
                <div
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: 4,
                    background: won
                      ? "#22c55e"
                      : isFilled
                        ? "#e0f2fe"
                        : "#f1f5f9",
                    border: won
                      ? "none"
                      : isFilled
                        ? "1px solid #bae6fd"
                        : "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 800,
                    color: won ? "#ffffff" : isFilled ? "#0369a1" : "#94a3b8",
                    flexShrink: 0,
                  }}
                >
                  {slot}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: won ? 800 : isFilled ? 600 : 400,
                    color: won ? "#15803d" : isFilled ? "#0f172a" : "#94a3b8",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {slotName}
                </span>
                {done && (
                  <div
                    style={{
                      minWidth: 20,
                      padding: "0 4px",
                      height: 17,
                      borderRadius: 4,
                      background: won ? "#22c55e" : "#f1f5f9",
                      border: won ? "none" : "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      color: won ? "#ffffff" : "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    {gs}
                  </div>
                )}
                {!done && canRecordScore && slot === 1 && (
                  <span
                    style={{
                      fontSize: 8,
                      color: "#0284c7",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      background: "#e0f2fe",
                      padding: "1px 5px",
                      borderRadius: 4,
                    }}
                  >
                    Score
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Bracket Canvas ───────────────────────────────────────────────────────────
interface ColDef {
  label: string;
  accent?: string;
  entries: { match: KnockoutMatch; tag: string }[];
}

const BracketCanvas: React.FC<{
  cols: ColDef[];
  isAdmin: boolean;
  isReferee: boolean;
  currentUserId?: string;
  onOpen: (m: KnockoutMatch) => void;
  onEdit: (m: KnockoutMatch) => void;
  onAssignReferee?: (m: KnockoutMatch) => void;
}> = ({
  cols,
  isAdmin,
  isReferee,
  currentUserId,
  onOpen,
  onEdit,
  onAssignReferee,
}) => {
  // Separate main knockout bracket columns from 3rd Place Playoff
  const mainCols = cols.filter((c) => c.label !== "3rd Place Playoff");
  const tpCol = cols.find((c) => c.label === "3rd Place Playoff");

  // Dynamic layout calculations based on the number of rounds (Bracket Size):
  // - 5+ rounds (R32/R64): compact cards (220px) with 36px gap so wide brackets fit cleanly
  // - 4 rounds (Round of 16): wider cards (265px) with 56px gap so it fills standard viewports
  // - 3 rounds (Quarter-Finals / 8 players): 285px cards with 68px gap, centered
  // - 2 rounds (Semi-Finals / 4 players): 300px cards with 80px gap, centered
  // - 1 round (Final only): 320px championship card, centered
  const colCount = mainCols.length;
  let currentCW = CW;
  let currentHG = HG;
  let isCentered = false;

  if (colCount >= 5) {
    currentCW = 220;
    currentHG = 36;
    isCentered = false;
  } else if (colCount === 4) {
    currentCW = 265;
    currentHG = 56;
    isCentered = true;
  } else if (colCount === 3) {
    currentCW = 285;
    currentHG = 68;
    isCentered = true;
  } else if (colCount === 2) {
    currentCW = 300;
    currentHG = 80;
    isCentered = true;
  } else if (colCount <= 1) {
    currentCW = 320;
    currentHG = 40;
    isCentered = true;
  }

  // Determine height from the first/largest round (Round of 32 or Round of 16)
  const n0 = mainCols.length > 0 ? mainCols[0].entries.length : 1;
  const bodyH = Math.max(n0 * CH + (n0 - 1) * VGAP, CH);
  const totalW = cols.length * currentCW + (cols.length - 1) * currentHG;

  // cyMap[ci][mi] stores the exact vertical center-Y of match mi in column ci
  const cyMap: number[][] = [];

  mainCols.forEach((col, ci) => {
    cyMap[ci] = [];
    if (ci === 0) {
      col.entries.forEach((_, mi) => {
        cyMap[ci][mi] = mi * (CH + VGAP) + CH / 2;
      });
    } else {
      col.entries.forEach((_, mi) => {
        const p1 = mi * 2;
        const p2 = mi * 2 + 1;
        const prevCY = cyMap[ci - 1] || [];
        if (p1 < prevCY.length && p2 < prevCY.length) {
          // Exactly halfway between its two parent matches
          cyMap[ci][mi] = (prevCY[p1] + prevCY[p2]) / 2;
        } else if (p1 < prevCY.length) {
          cyMap[ci][mi] = prevCY[p1];
        } else {
          cyMap[ci][mi] = mi * (CH + VGAP) + CH / 2;
        }
      });
    }
  });

  // Calculate 3rd Place Playoff center Y aligned with Final if present
  let tpCY = bodyH / 2;
  if (tpCol && tpCol.entries.length > 0) {
    const finalColIdx = mainCols.findIndex((c) => c.label === "Final");
    if (finalColIdx >= 0 && cyMap[finalColIdx]?.[0] !== undefined) {
      tpCY = cyMap[finalColIdx][0];
    }
  }

  // Draw connector lines between consecutive knockout rounds
  const lines: React.ReactElement[] = [];
  for (let ci = 0; ci < mainCols.length - 1; ci++) {
    const lc = mainCols[ci],
      rc = mainCols[ci + 1];
    const lx = ci * (currentCW + currentHG) + currentCW;
    const rx = (ci + 1) * (currentCW + currentHG);
    const mx = lx + currentHG / 2;

    rc.entries.forEach((rEntry, ri) => {
      const rY = cyMap[ci + 1]?.[ri] ?? ri * (CH + VGAP) + CH / 2;
      const p1 = ri * 2;
      const p2 = ri * 2 + 1;
      const prevCY = cyMap[ci] || [];

      const p1Match = lc.entries[p1]?.match;
      const p2Match = lc.entries[p2]?.match;

      const p1Done =
        p1Match?.status === "COMPLETED" ||
        p1Match?.status === "WALKOVER" ||
        p1Match?.score === "BYE" ||
        p1Match?.score === "W/O";
      const p2Done =
        p2Match?.status === "COMPLETED" ||
        p2Match?.status === "WALKOVER" ||
        p2Match?.score === "BYE" ||
        p2Match?.score === "W/O";

      // Horizontal line from Parent 1 to midpoint X
      if (p1 < prevCY.length) {
        const lY1 = prevCY[p1];
        lines.push(
          <line
            key={`lh1_${ci}_${p1}_${ri}`}
            x1={lx}
            y1={lY1}
            x2={mx}
            y2={lY1}
            stroke={p1Done ? "#22c55e" : "rgba(74, 238, 255, 0.7)"}
            strokeWidth={p1Done ? 2.5 : 2}
          />,
        );
      }

      // Horizontal line from Parent 2 to midpoint X
      if (p2 < prevCY.length) {
        const lY2 = prevCY[p2];
        lines.push(
          <line
            key={`lh2_${ci}_${p2}_${ri}`}
            x1={lx}
            y1={lY2}
            x2={mx}
            y2={lY2}
            stroke={p2Done ? "#22c55e" : "rgba(74, 238, 255, 0.7)"}
            strokeWidth={p2Done ? 2.5 : 2}
          />,
        );
      }

      // Vertical connector between the two parents
      if (p1 < prevCY.length && p2 < prevCY.length) {
        const lY1 = prevCY[p1];
        const lY2 = prevCY[p2];
        const topY = Math.min(lY1, lY2);
        const botY = Math.max(lY1, lY2);

        lines.push(
          <line
            key={`lv_${ci}_${ri}`}
            x1={mx}
            y1={topY}
            x2={mx}
            y2={botY}
            stroke="rgba(74, 238, 255, 0.7)"
            strokeWidth={2}
          />,
        );
      }

      // Horizontal line from midpoint X into child match
      const childDone =
        rEntry.match.status === "COMPLETED" ||
        rEntry.match.status === "WALKOVER" ||
        rEntry.match.score === "BYE" ||
        rEntry.match.score === "W/O";
      lines.push(
        <line
          key={`rh_${ci}_${ri}`}
          x1={mx}
          y1={rY}
          x2={rx}
          y2={rY}
          stroke={childDone ? "#22c55e" : "rgba(74, 238, 255, 0.7)"}
          strokeWidth={childDone ? 2.5 : 2}
        />,
      );
    });
  }

  return (
    <div
      style={{
        position: "relative",
        width: totalW,
        height: bodyH + LH + 16,
        margin: isCentered ? "0 auto" : undefined,
      }}
    >
      {/* Column labels */}
      {cols.map((col, ci) => (
        <div
          key={`lbl${ci}`}
          id={`bracket-col-${ci}`}
          style={{
            position: "absolute",
            top: 0,
            left: ci * (currentCW + currentHG),
            width: currentCW,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: col.accent ?? "#4AEEFF",
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {col.label}
          </span>
        </div>
      ))}

      {/* SVG connectors */}
      <svg
        style={{
          position: "absolute",
          top: LH + 16,
          left: 0,
          width: totalW,
          height: bodyH,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        {lines}
      </svg>

      {/* Cards */}
      {cols.map((col, ci) => {
        const isTP = col.label === "3rd Place Playoff";
        return col.entries.map(({ match, tag }, mi) => {
          const isAssignedReferee =
            isReferee &&
            Boolean(
              (match.referee?.user &&
                (match.referee.user as any).id === currentUserId) ||
              (match.referee as any)?.userId === currentUserId ||
              (match as any).refereeUserId === currentUserId,
            );
          const canRecordScore = isAdmin || isAssignedReferee;

          // Precise vertical card top placement
          let topY: number;
          if (isTP) {
            topY = tpCY - CH / 2;
          } else {
            const cy = cyMap[ci]?.[mi] ?? mi * (CH + VGAP) + CH / 2;
            topY = cy - CH / 2;
          }

          return (
            <div
              key={match.id}
              style={{
                position: "absolute",
                top: LH + 16 + topY,
                left: ci * (currentCW + currentHG),
              }}
            >
              <MatchCard
                match={match}
                matchLabel={tag}
                isAdmin={isAdmin}
                canRecordScore={canRecordScore}
                onOpen={onOpen}
                onEdit={onEdit}
                onAssignReferee={onAssignReferee}
                accent={col.accent}
                cardWidth={currentCW}
              />
            </div>
          );
        });
      })}
    </div>
  );
};

// ─── Main KnockoutBracket ─────────────────────────────────────────────────────
const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  tournamentId,
  categoryId,
  onScoreRecorded,
  refreshTrigger,
}) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<KnockoutMatch | null>(
    null,
  );
  const [editingMatch, setEditingMatch] = useState<KnockoutMatch | null>(null);
  const [assignRefereeMatch, setAssignRefereeMatch] =
    useState<KnockoutMatch | null>(null);

  useEffect(() => {
    if (selectedMatch) {
      const updatedMatch = matches.find((m) => m.id === selectedMatch.id);
      if (
        updatedMatch &&
        JSON.stringify(updatedMatch.referee) !==
          JSON.stringify(selectedMatch.referee)
      ) {
        setSelectedMatch(updatedMatch);
      }
    }
  }, [matches]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isReferee = user?.role === "REFEREE";

  useEffect(() => {
    load();
  }, [tournamentId, categoryId, refreshTrigger]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/matches/tournaments/${tournamentId}?categoryId=${categoryId}&t=${Date.now()}`,
      );
      const all: KnockoutMatch[] = res.data.data;
      for (const m of all) {
        if (m.player1Id && !m.player1) {
          try {
            m.player1 = (await api.get(`/users/${m.player1Id}`)).data.data;
          } catch {}
        }
        if (m.player2Id && !m.player2) {
          try {
            m.player2 = (await api.get(`/users/${m.player2Id}`)).data.data;
          } catch {}
        }
      }
      // Accept every recognisable knockout round — avoids dropping 'Final'
      // or any size-variant round (e.g. "Round of 8") from the state.
      const KNOCKOUT_ROUNDS = new Set([
        "Round of 128",
        "Round of 64",
        "Round of 32",
        "Round of 16",
        "Quarter-Finals",
        "Quarter-final",
        "Semi-Finals",
        "Semi-final",
        "Final",
        "Finals",
        "3rd Place Playoff",
      ]);
      setMatches(
        all.filter(
          (m) => KNOCKOUT_ROUNDS.has(m.round) || m.round.startsWith("Round of"),
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const round = (r: string) => {
    const normTarget = (r || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return matches
      .filter((m) => {
        const normMatch = (m.round || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        if (normTarget === "semifinals" || normTarget === "semifinal") {
          return normMatch === "semifinals" || normMatch === "semifinal";
        }
        if (normTarget === "quarterfinals" || normTarget === "quarterfinal") {
          return normMatch === "quarterfinals" || normMatch === "quarterfinal";
        }
        return normMatch === normTarget;
      })
      .sort((a, b) => a.matchNumber - b.matchNumber);
  };

  const handleCorrectScore = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
    reason: string,
  ) => {
    if (user?.role !== "ADMIN") {
      toast.error("Only admins can correct completed matches");
      return;
    }

    const correctedGames = games
      .filter((g) => g.p1 !== "" && g.p2 !== "")
      .map((g, index) => ({
        gameNumber: index + 1,
        player1Score: Number(g.p1),
        player2Score: Number(g.p2),
      }));

    try {
      await api.patch(`/matches/${matchId}/correct-score`, {
        games: correctedGames,
        bestOf,
        reason,
      });

      toast.success("Match score corrected successfully!");
      setSelectedMatch(null);
      await load();
      onScoreRecorded?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to correct match score",
      );
      throw error;
    }
  };

  const handleSave = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
    startTime?: string,
    endTime?: string,
  ) => {
    const match = matches.find((m) => m.id === matchId);
    const isDoubles = match?.matchType === "DOUBLES";

    // Guard: for singles both player slots must be filled;
    //        for doubles both team slots must be filled.
    const slot1Filled = isDoubles ? !!match?.team1 : !!match?.player1?.id;
    const slot2Filled = isDoubles ? !!match?.team2 : !!match?.player2?.id;
    if (!slot1Filled || !slot2Filled) {
      toast.error("Both players required");
      return;
    }

    const wn = Math.ceil(bestOf / 2);
    let p1W = 0,
      p2W = 0;
    const parts: string[] = [];
    for (const g of games) {
      if (!g.p1 || !g.p2) continue;
      const a = parseInt(g.p1),
        b = parseInt(g.p2);
      parts.push(`${a}-${b}`);
      if (a > b) p1W++;
      else p2W++;
    }
    if (p1W < wn && p2W < wn) {
      toast.error(`Need ${wn} wins`);
      return;
    }

    // For doubles: winnerId = winning team's ID so the highlight logic works.
    // For singles: winnerId = winning player's userId.
    const winnerId = !isDoubles
      ? p1W > p2W
        ? match!.player1!.id
        : match!.player2!.id
      : undefined;

    const winnerTeamId = isDoubles
      ? p1W > p2W
        ? match!.team1!.id
        : match!.team2!.id
      : undefined;

    const matchDate = match?.scheduledTime
      ? new Date(match.scheduledTime)
      : new Date();

    const toDateTime = (time?: string) => {
      if (!time) return undefined;

      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date(matchDate);
      date.setHours(hours, minutes, 0, 0);

      return date;
    };

    const startDate = toDateTime(startTime);
    const endDate = toDateTime(endTime);

    // A match may finish after midnight.
    if (startDate && endDate && endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const durationMinutes =
      startDate && endDate
        ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
        : null;

    try {
      const umpireName = match?.referee?.user
        ? `${match.referee.user.firstName} ${match.referee.user.lastName}`
        : user
          ? `${user.firstName} ${user.lastName} (Admin)`
          : undefined;

      await api.patch(`/matches/${matchId}`, {
        score: parts.join(", "),
        winnerId,
        winnerTeamId,
        status: "COMPLETED",
        ...(startDate ? { startTime: startDate.toISOString() } : {}),
        ...(endDate ? { endTime: endDate.toISOString() } : {}),
        resultDetails: {
          bestOf,
          umpireName,
          ...(durationMinutes !== null ? { durationMinutes } : {}),
        },
      });

      toast.success("Score saved!");
      setSelectedMatch(null);
      await new Promise((r) => setTimeout(r, 400));
      await load();
      onScoreRecorded?.();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: "3px solid rgba(255, 255, 255, 0.15)",
            borderTopColor: "#4AEEFF",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p
          style={{
            color: "#4AEEFF",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Loading bracket…
        </p>
      </div>
    );

  if (matches.length === 0)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 24px",
          background: "rgba(6, 29, 35, 0.4)",
          borderRadius: 16,
          border: "1px dashed rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
        <p
          style={{
            fontWeight: 800,
            color: "#ffffff",
            fontSize: 18,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          No knockout matches yet
        </p>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          Generate the bracket above to populate this tournament draw.
        </p>
        <button
          onClick={load}
          style={{
            marginTop: 18,
            padding: "10px 24px",
            background: "#4AEEFF",
            color: "#061D23",
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          🔄 Refresh Draw
        </button>
      </div>
    );

  const r32 = round("Round of 32");
  const r16 = round("Round of 16");
  const qf = round("Quarter-Finals");
  const targetSf = round("Semi-Finals");
  const fn =
    matches.find(
      (m) =>
        m.round.trim().toLowerCase() === "final" ||
        m.round.trim().toLowerCase() === "finals",
    ) ?? null;

  const cols: ColDef[] = [];
  if (r32.length)
    cols.push({
      label: "Round of 32",
      entries: r32.map((m, i) => ({ match: m, tag: `R32 ${i + 1}` })),
    });
  if (r16.length)
    cols.push({
      label: "Round of 16",
      entries: r16.map((m, i) => ({ match: m, tag: `R16 ${i + 1}` })),
    });
  if (qf.length)
    cols.push({
      label: "Quarter Finals",
      entries: qf.map((m, i) => ({ match: m, tag: `QF ${i + 1}` })),
    });
  if (targetSf.length)
    cols.push({
      label: "Semi Finals",
      entries: targetSf.map((m, i) => ({ match: m, tag: `SF ${i + 1}` })),
    });
  if (fn)
    cols.push({
      label: "Final",
      accent: "#22c55e",
      entries: [{ match: fn, tag: "F" }],
    });

  return (
    <div
      style={{
        fontFamily: "'Segoe UI',system-ui,sans-serif",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "visible",
      }}
    >
      {/* Mobile Swipe Hint */}
      <div className="sm:hidden px-3.5 py-2 mb-3 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/25 text-xs text-[#4AEEFF] flex items-center justify-between font-mono">
        <span>↔ Swipe across bracket</span>
      </div>

      {/* Bracket */}
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 16,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(74, 238, 255, 0.6) transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "max-content",
            minWidth: "100%",
            padding: "8px 24px 20px 24px",
            boxSizing: "border-box",
          }}
        >
          <BracketCanvas
            cols={cols}
            isAdmin={isAdmin}
            isReferee={isReferee}
            currentUserId={user?.id}
            onOpen={setSelectedMatch}
            onEdit={setEditingMatch}
            onAssignReferee={isAdmin ? setAssignRefereeMatch : undefined}
          />
        </div>
      </div>

      {/* Umpire sheet modal */}
      {selectedMatch && (
        <UmpireSheet
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSave={handleSave}
          onCorrectScore={handleCorrectScore}
          isAdminOrReferee={
            isAdmin ||
            (isReferee &&
              Boolean(
                (selectedMatch.referee?.user &&
                  (selectedMatch.referee.user as any).id === user?.id) ||
                (selectedMatch.referee as any)?.userId === user?.id ||
                (selectedMatch as any).refereeUserId === user?.id,
              ))
          }
        />
      )}

      {/* Edit match modal */}
      {editingMatch && (
        <EditKnockoutModal
          match={editingMatch}
          tournamentId={tournamentId}
          categoryId={categoryId}
          onClose={() => setEditingMatch(null)}
          onSuccess={() => {
            setEditingMatch(null);
            load();
          }}
        />
      )}

      {assignRefereeMatch && (
        <AssignRefereeModal
          isOpen={true}
          matchId={assignRefereeMatch.id}
          onClose={() => setAssignRefereeMatch(null)}
          onSuccess={() => {
            setAssignRefereeMatch(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default KnockoutBracket;
