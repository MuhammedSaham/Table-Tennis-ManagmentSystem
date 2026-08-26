import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import EditKnockoutModal from "./EditKnockoutMatchModal";
import { AssignRefereeModal } from "./AssignRefereeModal";

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
  score: string | null;
  status: string;
  scheduledTime?: string;
  referee?: {
    id: string;
    user: { firstName: string; lastName: string };
  } | null;
}
interface GameScore {
  p1: string;
  p2: string;
}
interface KnockoutBracketProps {
  tournamentId: string;
  categoryId: string;
  onScoreRecorded?: () => void;
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

const CW = 280;
const CH = 88;
const VGAP = 40;
const HG = 56;
const LH = 44;

// ─── Umpire Sheet ─────────────────────────────────────────────────────────────
export const UmpireSheet: React.FC<{
  match: KnockoutMatch;
  onClose: () => void;
  onSave: (id: string, games: GameScore[], bestOf: 3 | 5) => Promise<void>;
  isAdminOrReferee: boolean;
}> = ({ match, onClose, onSave, isAdminOrReferee }) => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-GB");
  const done = match.status === "COMPLETED";

  const initGames = (): GameScore[] => {
    if (match.score && done) {
      const parts = match.score.split(",").map((s) => s.trim());
      if (parts.length > 1)
        return [
          ...parts.map((p) => {
            const n = p.split("-");
            return { p1: n[0]?.trim() ?? "", p2: n[1]?.trim() ?? "" };
          }),
          ...Array(Math.max(0, 5 - parts.length)).fill({ p1: "", p2: "" }),
        ].slice(0, 5);
    }
    return Array(5)
      .fill(null)
      .map(() => ({ p1: "", p2: "" }));
  };

  const [bestOf, setBestOf] = useState<3 | 5>(5);
  const [games, setGames] = useState<GameScore[]>(initGames);
  const [saving, setSaving] = useState(false);
  const [pointsToWin, setPointsToWin] = useState<number>(11);

  const getGameWinner = (p1Str: string, p2Str: string): "p1" | "p2" | null => {
    if (p1Str === "" || p2Str === "") return null;
    const p1 = parseInt(p1Str);
    const p2 = parseInt(p2Str);
    if (isNaN(p1) || isNaN(p2)) return null;

    if (p1 >= pointsToWin && p1 - p2 >= 2) return "p1";
    if (p2 >= pointsToWin && p2 - p1 >= 2) return "p2";
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

    if (winner < pointsToWin) return false;
    if (winner === pointsToWin) return loser <= pointsToWin - 2;
    if (winner > pointsToWin) return loser === winner - 2;

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
              🏓
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
                    onChange={(e) =>
                      setPointsToWin(parseInt(e.target.value) || 11)
                    }
                    style={{
                      width: 45,
                      padding: "4px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center",
                      outline: "none",
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
                        setGames((prev) =>
                          prev.map((g, i) => (i >= n ? { p1: "", p2: "" } : g)),
                        );
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
                              if (!isAdminOrReferee || done || !nd) return;
                              const nx = [...games];
                              nx[i] = { ...nx[i], [side]: e.target.value };
                              setGames(nx);
                            }}
                            disabled={!isAdminOrReferee || done || !nd}
                            style={{
                              width: 42,
                              height: 36,
                              textAlign: "center",
                              border: "1.5px solid",
                              borderColor:
                                !isAdminOrReferee || done || !nd
                                  ? "#e2e8f0"
                                  : "#cbd5e1",
                              borderRadius: 8,
                              fontSize: 15,
                              fontWeight: 700,
                              color: !nd ? "#cbd5e1" : "#0f172a",
                              background:
                                !isAdminOrReferee || done || !nd
                                  ? "#f8fafc"
                                  : "#fff",
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
            <div style={{ fontSize: 13, color: "#475569" }}>
              <strong>Umpire:</strong>{" "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                {match.referee?.user
                  ? `${match.referee.user.firstName} ${match.referee.user.lastName}`
                  : user
                    ? `${user.firstName} ${user.lastName}`
                    : "…………………………"}
              </span>
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
          {isAdminOrReferee && !done && (
            <button
              onClick={async () => {
                for (let i = 0; i < games.length; i++) {
                  const g = games[i];
                  if (g.p1 === "" && g.p2 === "") continue;
                  if (!isGameValid(g.p1, g.p2)) {
                    toast.error(
                      `Game ${i + 1} has an invalid score. A game is played to ${pointsToWin} points and must be won by 2 clear points.`,
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
                await onSave(match.id, games, bestOf);
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
  isAdminOrReferee: boolean;
  onOpen: (m: KnockoutMatch) => void;
  onEdit: (m: KnockoutMatch) => void; // ← NEW
  onAssignReferee?: (m: KnockoutMatch) => void;
  accent?: string;
}> = ({
  match,
  matchLabel,
  isAdminOrReferee,
  onOpen,
  onEdit,
  onAssignReferee,
  accent,
}) => {
  const done = match.status === "COMPLETED";
  const isDoubles = match.matchType === "DOUBLES";
  // For doubles the winnerId stores the winning team captain's userId;
  // compare against team1Id/team2Id for the highlight logic.
  const p1Won =
    done &&
    (isDoubles
      ? match.winnerId === match.team1?.id
      : match.winnerId === match.player1?.id);
  const p2Won =
    done &&
    (isDoubles
      ? match.winnerId === match.team2?.id
      : match.winnerId === match.player2?.id);
  const border = accent ?? (done ? "#22c55e" : "#e2e8f0");

  const gameParts =
    match.score && match.score !== "BYE"
      ? match.score.split(",").map((s) => s.trim())
      : [];
  const p1Games =
    match.score === "BYE" && p1Won
      ? "BYE"
      : gameParts.filter((g) => {
          const [a, b] = g.split("-").map(Number);
          return a > b;
        }).length;
  const p2Games =
    match.score === "BYE" && p2Won
      ? "BYE"
      : gameParts.filter((g) => {
          const [a, b] = g.split("-").map(Number);
          return b > a;
        }).length;

  const isBye = match.score === "BYE";

  return (
    <div
      onClick={() => !isBye && onOpen(match)}
      style={{
        width: CW,
        cursor: isBye ? "default" : "pointer",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}
      title={
        isBye
          ? "BYE — Player advances automatically"
          : "Click to open umpire sheet"
      }
    >
      <div
        style={{
          border: `1.5px solid ${isBye ? "#d1d5db" : border}`,
          borderRadius: 10,
          overflow: "hidden",
          background: isBye ? "#f9fafb" : "#fff",
          boxShadow: isBye
            ? "none"
            : done
              ? "0 1px 6px rgba(34,197,94,0.18)"
              : "0 1px 4px rgba(0,0,0,0.07)",
          opacity: isBye ? 0.82 : 1,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!isBye) {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 18px rgba(0,0,0,0.13)";
            (e.currentTarget as HTMLElement).style.transform =
              "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isBye) {
            (e.currentTarget as HTMLElement).style.boxShadow = done
              ? "0 1px 6px rgba(34,197,94,0.18)"
              : "0 1px 4px rgba(0,0,0,0.07)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }
        }}
      >
        {/* Match header bar */}
        <div
          style={{
            background: isBye ? "#f3f4f6" : "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "5px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: isBye ? "#9ca3af" : accent ? accent : "#475569",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {matchLabel}
          </span>
          {isBye ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#6b7280",
                background: "#e5e7eb",
                padding: "2px 8px",
                borderRadius: 10,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              BYE
            </span>
          ) : (
            <>
              {match.scheduledTime && (
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  {fmtTime(match.scheduledTime)}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {done && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#16a34a",
                      fontWeight: 700,
                      background: "#dcfce7",
                      padding: "1px 8px",
                      borderRadius: 10,
                    }}
                  >
                    ✓ Done
                  </span>
                )}
                {isAdminOrReferee && !done && onAssignReferee && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignReferee(match);
                    }}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "#475569",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                    title="Assign a referee to this match"
                  >
                    👨‍⚖️ Assign Referee
                  </button>
                )}
                {isAdminOrReferee && !done && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(match);
                    }}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "#475569",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                    title="Edit players in this match"
                  >
                    ✏️ Edit
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
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#f3f4f6",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: "#d1d5db",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                color: "#6b7280",
                flexShrink: 0,
              }}
            >
              1
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#374151",
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
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
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
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: idx === 0 ? "1px solid #f1f5f9" : "none",
                  background: won ? "#f0fdf4" : "#fff",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: won
                      ? "#22c55e"
                      : isFilled
                        ? "#e2e8f0"
                        : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    color: won ? "#fff" : "#475569",
                    flexShrink: 0,
                  }}
                >
                  {slot}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: won ? 800 : 500,
                    color: won ? "#166534" : isFilled ? "#0f172a" : "#94a3b8",
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
                      minWidth: 28,
                      padding: "0 6px",
                      height: 24,
                      borderRadius: 6,
                      background: won ? "#22c55e" : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      color: won ? "#fff" : "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    {gs}
                  </div>
                )}
                {!done && isAdminOrReferee && slot === 1 && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "#3b82f6",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    click to score
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

// ← onEdit added to BracketCanvas props
const BracketCanvas: React.FC<{
  cols: ColDef[];
  isAdminOrReferee: boolean;
  onOpen: (m: KnockoutMatch) => void;
  onEdit: (m: KnockoutMatch) => void;
  onAssignReferee?: (m: KnockoutMatch) => void;
}> = ({ cols, isAdminOrReferee, onOpen, onEdit, onAssignReferee }) => {
  const maxN = Math.max(...cols.map((c) => c.entries.length));
  const bodyH = maxN * CH + (maxN - 1) * VGAP;
  const totalW = cols.length * CW + (cols.length - 1) * HG;

  const top = (n: number) => (bodyH - (n * CH + (n - 1) * VGAP)) / 2;
  const cy = (n: number, i: number) => top(n) + i * (CH + VGAP) + CH / 2;

  const lines: React.ReactElement[] = [];
  for (let ci = 0; ci < cols.length - 1; ci++) {
    const lc = cols[ci],
      rc = cols[ci + 1];
    const lx = ci * (CW + HG) + CW;
    const rx = (ci + 1) * (CW + HG);
    const mx = lx + HG / 2;

    rc.entries.forEach((_, ri) => {
      const rY = cy(rc.entries.length, ri);
      const pair = [ri * 2, ri * 2 + 1].filter((i) => i < lc.entries.length);
      pair.forEach((li) => {
        const lY = cy(lc.entries.length, li);
        lines.push(
          <line
            key={`lh${ci}${li}${ri}`}
            x1={lx}
            y1={lY}
            x2={mx}
            y2={lY}
            stroke="#d1d5db"
            strokeWidth={1.5}
          />,
        );
      });
      if (pair.length === 2) {
        lines.push(
          <line
            key={`lv${ci}${ri}`}
            x1={mx}
            y1={cy(lc.entries.length, pair[0])}
            x2={mx}
            y2={cy(lc.entries.length, pair[1])}
            stroke="#d1d5db"
            strokeWidth={1.5}
          />,
        );
      }
      lines.push(
        <line
          key={`rh${ci}${ri}`}
          x1={mx}
          y1={rY}
          x2={rx}
          y2={rY}
          stroke="#d1d5db"
          strokeWidth={1.5}
        />,
      );
    });
  }

  return (
    <div
      style={{ position: "relative", width: totalW, height: bodyH + LH + 16 }}
    >
      {/* Column labels */}
      {cols.map((col, ci) => (
        <div
          key={`lbl${ci}`}
          style={{
            position: "absolute",
            top: 0,
            left: ci * (CW + HG),
            width: CW,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              padding: "6px 20px",
              borderRadius: 6,
              background: col.accent ? `${col.accent}15` : "#f1f5f9",
              color: col.accent ?? "#374151",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.3,
              border: `1px solid ${col.accent ? `${col.accent}40` : "#e5e7eb"}`,
            }}
          >
            {col.label}
          </div>
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

      {/* Cards — pass onEdit down */}
      {cols.map((col, ci) =>
        col.entries.map(({ match, tag }, mi) => (
          <div
            key={match.id}
            style={{
              position: "absolute",
              top: LH + 16 + top(col.entries.length) + mi * (CH + VGAP),
              left: ci * (CW + HG),
            }}
          >
            <MatchCard
              match={match}
              matchLabel={tag}
              isAdminOrReferee={isAdminOrReferee}
              onOpen={onOpen}
              onEdit={onEdit}
              onAssignReferee={onAssignReferee}
              accent={col.accent}
            />
          </div>
        )),
      )}
    </div>
  );
};

// ─── Main KnockoutBracket ─────────────────────────────────────────────────────
const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  tournamentId,
  categoryId,
  onScoreRecorded,
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

  const isAdminOrReferee = user?.role === "ADMIN" || user?.role === "REFEREE";

  useEffect(() => {
    load();
  }, [tournamentId, categoryId]);

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

  const round = (r: string) =>
    matches
      .filter((m) => m.round === r)
      .sort((a, b) => a.matchNumber - b.matchNumber);

  const handleSave = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
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

    try {
      await api.patch(`/matches/${matchId}`, {
        score: parts.join(", "),
        winnerId,
        winnerTeamId,
        status: "COMPLETED",
        endTime: new Date().toISOString(),
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
      <div style={{ textAlign: "center", padding: 60 }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e2e8f0",
            borderTopColor: "#e11d48",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "#94a3b8" }}>Loading bracket…</p>
      </div>
    );

  if (matches.length === 0)
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          background: "#f8fafc",
          borderRadius: 16,
          border: "1px dashed #cbd5e1",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
        <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 16 }}>
          No knockout matches yet
        </p>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          Complete the group stage first.
        </p>
        <button
          onClick={load}
          style={{
            marginTop: 16,
            padding: "8px 20px",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🔄 Refresh
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
  const tp = round("3rd Place Playoff")[0] ?? null;

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
      accent: "#16a34a",
      entries: [{ match: fn, tag: "F" }],
    });
  if (tp)
    cols.push({
      label: "3rd Place Playoff",
      accent: "#b45309",
      entries: [{ match: tp, tag: "3RD" }],
    });

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#e11d48",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Knockout Draw
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: -0.5,
          }}
        >
          Tournament Bracket
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
          All matches best of 5 games · Click any match to record score
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {isAdminOrReferee && (
          <span
            style={{
              fontSize: 12,
              color: "#3b82f6",
              fontWeight: 600,
              alignSelf: "center",
            }}
          >
            💡 Click any match card to open umpire sheet · ✏️ Edit to change
            players
          </span>
        )}
        <button
          onClick={load}
          style={{
            padding: "7px 16px",
            background: "#fff",
            color: "#374151",
            border: "1.5px solid #e2e8f0",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Bracket */}
      <div style={{ overflowX: "auto", paddingBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "8px 24px",
            minWidth: "fit-content",
          }}
        >
          <BracketCanvas
            cols={cols}
            isAdminOrReferee={isAdminOrReferee}
            onOpen={setSelectedMatch}
            onEdit={setEditingMatch}
            onAssignReferee={
              user?.role === "ADMIN" ? setAssignRefereeMatch : undefined
            }
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 8,
          padding: "10px 16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <span>All matches are best of 5 games</span>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            ["#22c55e", "Winner / Completed"],
            ["#e2e8f0", "Pending"],
          ].map(([c, l]) => (
            <span
              key={l}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: c,
                }}
              />
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Umpire sheet modal */}
      {selectedMatch && (
        <UmpireSheet
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSave={handleSave}
          isAdminOrReferee={isAdminOrReferee}
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
