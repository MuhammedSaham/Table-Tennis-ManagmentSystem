import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupPlayer {
  player: { id: string; firstName: string; lastName: string };
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  gamesWon: number;
  gamesLost: number;
  pointsScored: number;
  pointsConceded: number;
}

export interface GroupMatch {
  id: string;
  player1Id: string;
  player2Id: string;
  player1: { id: string; firstName: string; lastName: string };
  player2: { id: string; firstName: string; lastName: string };
  player1Score: number | null;
  player2Score: number | null;
  status: string;
  bestOf?: number;
  game1player1?: number | null;
  game1player2?: number | null;
  game2player1?: number | null;
  game2player2?: number | null;
  game3player1?: number | null;
  game3player2?: number | null;
  game4player1?: number | null;
  game4player2?: number | null;
  game5player1?: number | null;
  game5player2?: number | null;
  referee?: { id: string; user: { firstName: string; lastName: string; } } | null;
}

interface Group {
  id: string;
  name: string;
  players: GroupPlayer[];
  matches: GroupMatch[];
}

interface Props {
  tournamentId: string;
  categoryId: string;
  isAdminOrReferee?: boolean;
  onScoreUpdate?: () => void;
}

export interface UmpireSheetProps {
  match: GroupMatch;
  onClose: () => void;
  onSave: (matchId: string, games: GameScore[], bestOf: 3 | 5) => Promise<void>;
  isAdminOrReferee: boolean;
  categoryName?: string;
  onAssignReferee?: (match: GroupMatch) => void;
}

export interface GameScore {
  p1: string;
  p2: string;
}

// ─── Umpire Sheet Modal ───────────────────────────────────────────────────────

export const UmpireSheet: React.FC<UmpireSheetProps> = ({
  match,
  onClose,
  onSave,
  isAdminOrReferee,
  categoryName,
  onAssignReferee,
}) => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-GB");
  const isCompleted = match.status === "COMPLETED";

  // bestOf toggle — default to 5, or use stored value if already played
  const [bestOf, setBestOf] = useState<3 | 5>((match.bestOf as 3 | 5) ?? 5);
  const winsNeeded = Math.ceil(bestOf / 2); // 3 for BO5, 2 for BO3

  const initGames = (): GameScore[] => [
    {
      p1: match.game1player1 != null ? String(match.game1player1) : "",
      p2: match.game1player2 != null ? String(match.game1player2) : "",
    },
    {
      p1: match.game2player1 != null ? String(match.game2player1) : "",
      p2: match.game2player2 != null ? String(match.game2player2) : "",
    },
    {
      p1: match.game3player1 != null ? String(match.game3player1) : "",
      p2: match.game3player2 != null ? String(match.game3player2) : "",
    },
    {
      p1: match.game4player1 != null ? String(match.game4player1) : "",
      p2: match.game4player2 != null ? String(match.game4player2) : "",
    },
    {
      p1: match.game5player1 != null ? String(match.game5player1) : "",
      p2: match.game5player2 != null ? String(match.game5player2) : "",
    },
  ];

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

  // Count games won so far
  const countWins = (side: "p1" | "p2") =>
    games.filter((g) => getGameWinner(g.p1, g.p2) === side).length;

  const p1Wins = countWins("p1");
  const p2Wins = countWins("p2");
  const matchOver = p1Wins >= winsNeeded || p2Wins >= winsNeeded;

  // A game is needed only if neither player has won enough yet at that point
  const gameIsNeeded = (gameIndex: number): boolean => {
    let w1 = 0,
      w2 = 0;
    for (let i = 0; i < gameIndex; i++) {
      const g = games[i];
      const winner = getGameWinner(g.p1, g.p2);
      if (winner === "p1") w1++;
      if (winner === "p2") w2++;
    }
    return w1 < winsNeeded && w2 < winsNeeded;
  };

  // Hide games beyond bestOf
  const visibleGameCount = bestOf;

  const updateGame = (i: number, side: "p1" | "p2", val: string) => {
    if (!isAdminOrReferee || isCompleted) return;
    if (!gameIsNeeded(i)) return; // don't allow editing decided games
    const next = [...games];
    next[i] = { ...next[i], [side]: val };
    setGames(next);
  };

  const handleSave = async () => {
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      if (g.p1 === "" && g.p2 === "") continue;
      if (!isGameValid(g.p1, g.p2)) {
        toast.error(`Game ${i + 1} has an invalid score. A game is played to ${pointsToWin} points and must be won by 2 clear points.`);
        return;
      }
    }

    if (!matchOver) {
      toast.error(`Match not complete. ${winsNeeded} game wins needed to win.`);
      return;
    }
    setSaving(true);
    await onSave(match.id, games, bestOf);
    setSaving(false);
  };

  const p1Name = `${match.player1.firstName} ${match.player1.lastName}`;
  const p2Name = `${match.player2.firstName} ${match.player2.lastName}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
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
          maxWidth: 600,
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
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
              <div
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                }}
              >
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Sheet body */}
        <div style={{ padding: "24px 24px 20px" }}>
          {/* Date + category + Best Of toggle */}
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
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#475569" }}>
                <strong>DATE:</strong> {today}
              </span>
              {categoryName && (
                <span style={{ color: "#e11d48", fontWeight: 700, fontSize: 13 }}>
                  {categoryName}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Pts to Win:</span>
                <input
                  type="number"
                  min={1}
                  value={pointsToWin}
                  onChange={(e) => setPointsToWin(parseInt(e.target.value) || 11)}
                  disabled={!isAdminOrReferee || isCompleted}
                  style={{
                    width: 45,
                    padding: "4px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "center",
                    outline: "none"
                  }}
                />
              </div>

            {/* Best Of toggle — only editable before match starts */}
            {!isCompleted && isAdminOrReferee && (
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
                      // Clear games beyond new bestOf
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
            )}
            {isCompleted && (
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
          </div>

          {/* Progress indicator */}
          {!isCompleted && (
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
                {p1Name}: {p1Wins}
              </span>
              <span style={{ color: "#64748b", margin: "0 10px" }}>vs</span>
              <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                {p2Name}: {p2Wins}
              </span>
              {matchOver && (
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
                  ✓ {p1Wins > p2Wins ? p1Name : p2Name} wins!
                </span>
              )}
              {!matchOver && (
                <span
                  style={{ marginLeft: 12, color: "#94a3b8", fontSize: 12 }}
                >
                  First to {winsNeeded} wins
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
                      minWidth: 130,
                    }}
                  />
                  {Array.from(
                    { length: visibleGameCount },
                    (_, i) => i + 1,
                  ).map((g) => (
                    <th
                      key={g}
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        border: "1px solid #e2e8f0",
                        width: 54,
                        color: gameIsNeeded(g - 1) ? "#0f172a" : "#cbd5e1",
                        background: gameIsNeeded(g - 1) ? "#fff" : "#f8fafc",
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
                    label: p1Name,
                    side: "p1" as const,
                    wins: p1Wins,
                    color: "#0369a1",
                  },
                  {
                    label: p2Name,
                    side: "p2" as const,
                    wins: p2Wins,
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
                    {Array.from({ length: visibleGameCount }, (_, i) => i).map(
                      (i) => {
                        const needed = gameIsNeeded(i);
                        const g = games[i];
                        return (
                          <td
                            key={i}
                            style={{
                              padding: "4px 6px",
                              textAlign: "center",
                              border: "1px solid #e2e8f0",
                              background: !needed ? "#f8fafc" : "#fff",
                            }}
                          >
                            <input
                              type="number"
                              min={0}
                              value={g[side]}
                              onChange={(e) =>
                                updateGame(i, side, e.target.value)
                              }
                              disabled={
                                !isAdminOrReferee || isCompleted || !needed
                              }
                              style={{
                                width: 42,
                                height: 36,
                                textAlign: "center",
                                border: "1.5px solid",
                                borderColor:
                                  !isAdminOrReferee || isCompleted || !needed
                                    ? "#e2e8f0"
                                    : "#cbd5e1",
                                borderRadius: 8,
                                fontSize: 15,
                                fontWeight: 700,
                                color: !needed ? "#cbd5e1" : "#0f172a",
                                background:
                                  !isAdminOrReferee || isCompleted || !needed
                                    ? "#f8fafc"
                                    : "#fff",
                                outline: "none",
                                cursor:
                                  !isAdminOrReferee || isCompleted || !needed
                                    ? "default"
                                    : "text",
                              }}
                              onFocus={(e) => {
                                if (needed) e.target.style.borderColor = color;
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = "#cbd5e1";
                              }}
                            />
                          </td>
                        );
                      },
                    )}
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

          {/* Winner & Signature row */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: "#475569" }}>
              <strong>Won by:</strong>{" "}
              {p1Wins > p2Wins ? (
                <span style={{ color: "#0369a1", fontWeight: 700 }}>
                  {p1Name}
                </span>
              ) : p2Wins > p1Wins ? (
                <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                  {p2Name}
                </span>
              ) : (
                <span style={{ color: "#94a3b8" }}>…………………………</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#475569" }}>
              <strong>Umpire:</strong>{" "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                {match.referee?.user ? `${match.referee.user.firstName} ${match.referee.user.lastName}` : (user ? `${user.firstName} ${user.lastName}` : "…………………………")}
              </span>
            </div>
          </div>

          {isCompleted && (
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
          {user?.role === "ADMIN" && !isCompleted && onAssignReferee && (
            <button
              onClick={() => onAssignReferee(match)}
              style={{
                padding: "9px 20px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                background: "#f8fafc",
                color: "#0f172a",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                marginRight: "auto",
              }}
            >
              👨‍⚖️ Assign Referee
            </button>
          )}
          {isAdminOrReferee && !isCompleted && (
            <button
              onClick={handleSave}
              disabled={saving || !matchOver}
              style={{
                padding: "9px 24px",
                border: "none",
                borderRadius: 10,
                background: saving || !matchOver ? "#94a3b8" : "#0f172a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: saving || !matchOver ? "default" : "pointer",
              }}
            >
              {saving
                ? "Saving…"
                : !matchOver
                  ? `Need ${winsNeeded} wins`
                  : "Save Score"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main GroupStandings ──────────────────────────────────────────────────────

import { AssignRefereeModal } from "./AssignRefereeModal";

const GroupStandings: React.FC<Props> = ({
  tournamentId,
  categoryId,
  isAdminOrReferee = false,
  onScoreUpdate,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMatch, setActiveMatch] = useState<GroupMatch | null>(null);
  const [activeGroupName, setActiveGroupName] = useState("");
  const [assignRefereeMatch, setAssignRefereeMatch] = useState<GroupMatch | null>(null);

  useEffect(() => {
    if (activeMatch) {
      for (const group of groups) {
        const updatedMatch = group.matches?.find((m) => m.id === activeMatch.id);
        if (updatedMatch && JSON.stringify(updatedMatch.referee) !== JSON.stringify(activeMatch.referee)) {
          setActiveMatch(updatedMatch);
          break;
        }
      }
    }
  }, [groups]);

  useEffect(() => {
    fetchStandings();
  }, [tournamentId, categoryId]);

  const fetchStandings = async () => {
    try {
      const res = await api.get(
        `/groups/tournaments/${tournamentId}/categories/${categoryId}/standings`,
      );
      setGroups(res.data.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const findMatch = (
    group: Group,
    p1Id: string,
    p2Id: string,
  ): GroupMatch | undefined =>
    group.matches?.find(
      (m) =>
        (m.player1Id === p1Id && m.player2Id === p2Id) ||
        (m.player1Id === p2Id && m.player2Id === p1Id),
    );

  const cellContent = (
    group: Group,
    rowPlayerId: string,
    colPlayerId: string,
  ) => {
    const match = findMatch(group, rowPlayerId, colPlayerId);
    if (!match) return null;
    const isPlayer1 = match.player1Id === rowPlayerId;
    const myScore = isPlayer1 ? match.player1Score : match.player2Score;
    const oppScore = isPlayer1 ? match.player2Score : match.player1Score;
    if (myScore === null || oppScore === null) return null;
    return `${myScore}/${oppScore}`;
  };

  const handleCellClick = (group: Group, rowId: string, colId: string) => {
    const match = findMatch(group, rowId, colId);
    if (!match) return;
    setActiveMatch(match);
    setActiveGroupName(group.name);
  };

  // ── Updated handleSaveScore — sends games array + bestOf to backend ──
  const handleSaveScore = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
  ) => {
    const gamesPayload = games.map((g) => ({
      p1: g.p1 !== "" ? parseInt(g.p1) : null,
      p2: g.p2 !== "" ? parseInt(g.p2) : null,
    }));

    await api.patch(`/groups/group-matches/${matchId}`, {
      games: gamesPayload,
      bestOf,
    });

    await fetchStandings();
    onScoreUpdate?.();
    setActiveMatch(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
        Loading standings…
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          background: "#f8fafc",
          borderRadius: 16,
          border: "1px dashed #cbd5e1",
          color: "#94a3b8",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏓</div>
        <p style={{ fontWeight: 600 }}>No groups created yet.</p>
        <p style={{ fontSize: 13 }}>Admin needs to create groups first.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {groups.map((group) => {
        const players = group.players;
        return (
          <div
            key={group.id}
            style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            {/* Group header */}
            <div
              style={{
                background: "#0f172a",
                padding: "14px 24px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>🏆</span>
              <h3
                style={{
                  margin: 0,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: -0.5,
                  textTransform: "uppercase",
                }}
              >
                {group.name}
              </h3>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                {players.length} players
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 480,
                }}
              >
                <thead>
                  <tr style={{ background: "#f0f9ff" }}>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "10px 14px",
                        minWidth: 140,
                        background: "#f8fafc",
                      }}
                    />
                    {players.map((p) => (
                      <th
                        key={p.player.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "12px 8px",
                          width: 68,
                          background: "#fef9c3",
                        }}
                      >
                        <div
                          style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.player.firstName} {p.player.lastName}
                        </div>
                      </th>
                    ))}
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "10px 12px",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#0f172a",
                        background: "#f0f9ff",
                        width: 50,
                      }}
                    >
                      MP
                    </th>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "10px 12px",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#0f172a",
                        background: "#f0f9ff",
                        width: 44,
                      }}
                    >
                      R
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((rowPlayer, rowIdx) => (
                    <tr
                      key={rowPlayer.player.id}
                      style={{
                        background: rowIdx % 2 === 0 ? "#fffdf0" : "#fff",
                      }}
                    >
                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "12px 16px",
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#0f172a",
                          background: "#fef9c3",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {rowPlayer.player.firstName} {rowPlayer.player.lastName}
                      </td>

                      {players.map((colPlayer) => {
                        const isSelf =
                          rowPlayer.player.id === colPlayer.player.id;
                        if (isSelf) {
                          return (
                            <td
                              key={colPlayer.player.id}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#1e293b",
                                textAlign: "center",
                                fontSize: 18,
                                color: "#fff",
                              }}
                            >
                              ✕
                            </td>
                          );
                        }
                        const score = cellContent(
                          group,
                          rowPlayer.player.id,
                          colPlayer.player.id,
                        );
                        const match = findMatch(
                          group,
                          rowPlayer.player.id,
                          colPlayer.player.id,
                        );
                        const isWin =
                          score !== null &&
                          parseInt(score.split("/")[0]) >
                            parseInt(score.split("/")[1]);

                        return (
                          <td
                            key={colPlayer.player.id}
                            onClick={() =>
                              match &&
                              handleCellClick(
                                group,
                                rowPlayer.player.id,
                                colPlayer.player.id,
                              )
                            }
                            style={{
                              border: "1px solid #e2e8f0",
                              textAlign: "center",
                              padding: "10px 6px",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: match ? "pointer" : "default",
                              background: score
                                ? isWin
                                  ? "#dcfce7"
                                  : "#fee2e2"
                                : "#fff",
                              color: score
                                ? isWin
                                  ? "#166534"
                                  : "#991b1b"
                                : "#94a3b8",
                              transition: "filter 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (match)
                                (e.currentTarget as HTMLElement).style.filter =
                                  "brightness(0.93)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.filter =
                                "brightness(1)";
                            }}
                            title={match ? "Click to view umpire sheet" : ""}
                          >
                            {score ??
                              (match ? (
                                <span
                                  style={{ fontSize: 11, color: "#cbd5e1" }}
                                >
                                  —
                                </span>
                              ) : (
                                ""
                              ))}
                          </td>
                        );
                      })}

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: 15,
                          color: "#0f172a",
                          background: "#f0f9ff",
                        }}
                      >
                        {rowPlayer.points}
                      </td>
                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: 15,
                          background: "#f0f9ff",
                          color:
                            rowIdx === 0
                              ? "#b45309"
                              : rowIdx === 1
                                ? "#475569"
                                : "#0f172a",
                        }}
                      >
                        {rowIdx + 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div
              style={{
                padding: "10px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                alignItems: "center",
                fontSize: 12,
                color: "#64748b",
                background: "#f8fafc",
              }}
            >
              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    background: "#dcfce7",
                    borderRadius: 3,
                    marginRight: 4,
                  }}
                />
                Win
              </span>
              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    background: "#fee2e2",
                    borderRadius: 3,
                    marginRight: 4,
                  }}
                />
                Loss
              </span>
              <span>MP = Match Points · R = Rank</span>
              {isAdminOrReferee ? (
                <span
                  style={{
                    marginLeft: "auto",
                    color: "#3b82f6",
                    fontWeight: 600,
                  }}
                >
                  💡 Click any cell to open umpire sheet
                </span>
              ) : (
                <span style={{ marginLeft: "auto", color: "#94a3b8" }}>
                  Click any cell to view match details
                </span>
              )}
              <span>🏆 Top 2 advance to knockout</span>
            </div>
          </div>
        );
      })}

      {activeMatch && (
        <UmpireSheet
          match={activeMatch}
          onClose={() => setActiveMatch(null)}
          onSave={handleSaveScore}
          isAdminOrReferee={isAdminOrReferee}
          categoryName={activeGroupName}
          onAssignReferee={setAssignRefereeMatch}
        />
      )}

      {assignRefereeMatch && (
        <AssignRefereeModal
          isOpen={true}
          matchId={assignRefereeMatch.id}
          onClose={() => setAssignRefereeMatch(null)}
          onSuccess={() => {
            setAssignRefereeMatch(null);
            fetchStandings();
          }}
          isGroupMatch={true}
        />
      )}
    </div>
  );
};

export default GroupStandings;
