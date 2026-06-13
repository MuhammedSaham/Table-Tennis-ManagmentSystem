import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}
interface KnockoutMatch {
  id: string;
  round: string;
  player1: Player | null;
  player2: Player | null;
  player1Id: string | null;
  player2Id: string | null;
  status: string;
}

interface Props {
  match: KnockoutMatch;
  tournamentId: string;
  categoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EditKnockoutMatchModal: React.FC<Props> = ({
  match,
  tournamentId,
  categoryId,
  onClose,
  onSuccess,
}) => {
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [player1Id, setPlayer1Id] = useState<string>(match.player1Id ?? "");
  const [player2Id, setPlayer2Id] = useState<string>(match.player2Id ?? "");
  const [action, setAction] = useState<"replace" | "walkover" | "swap">(
    "replace",
  );
  const [walkoverSlot, setWalkoverSlot] = useState<"player1" | "player2">(
    "player1",
  );
  const [saving, setSaving] = useState(false);
  const [swapMatchId, setSwapMatchId] = useState<string>("");
  const [swapSlot, setSwapSlot] = useState<"player1" | "player2">("player1");
  const [sameRoundMatches, setSameRoundMatches] = useState<KnockoutMatch[]>([]);

  useEffect(() => {
    fetchPlayers();
    fetchSameRoundMatches();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await api.get(
        `/tournaments/${tournamentId}/registrations?status=APPROVED&categoryId=${categoryId}`,
      );
      setRegisteredPlayers(res.data.data.map((r: any) => r.player));
    } catch {}
  };

  const fetchSameRoundMatches = async () => {
    try {
      const res = await api.get(`/matches/tournaments/${tournamentId}`);
      setSameRoundMatches(
        res.data.data.filter(
          (m: KnockoutMatch) =>
            m.round === match.round &&
            m.id !== match.id &&
            m.status !== "COMPLETED",
        ),
      );
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (action === "replace") {
        // Validate no duplicate
        if (player1Id && player2Id && player1Id === player2Id) {
          toast.error("Player 1 and Player 2 cannot be the same");
          return;
        }
        await api.patch(`/matches/${match.id}`, {
          player1Id: player1Id || null,
          player2Id: player2Id || null,
        });
        toast.success("Match players updated");
      } else if (action === "walkover") {
        // The other player wins automatically
        const winnerId =
          walkoverSlot === "player1" ? match.player2Id : match.player1Id;
        if (!winnerId) {
          toast.error("Cannot walkover — opponent slot is empty");
          return;
        }
        await api.patch(`/matches/${match.id}`, {
          status: "WALKOVER",
          winnerId,
          score: "W/O",
        });
        toast.success("Walkover recorded — opponent advances");
      } else if (action === "swap") {
        // Swap a player between two matches in the same round
        if (!swapMatchId) {
          toast.error("Select a match to swap with");
          return;
        }
        await api.post(`/matches/swap-players`, {
          match1Id: match.id,
          match2Id: swapMatchId,
          slot1: "player1", // which slot from match 1
          slot2: swapSlot, // which slot from match 2
        });
        toast.success("Players swapped successfully");
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update match");
    } finally {
      setSaving(false);
    }
  };

  const playerName = (p: Player | null) =>
    p ? `${p.firstName} ${p.lastName}` : "TBD";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
          fontFamily: "'Segoe UI',system-ui,sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ background: "#0f172a", padding: "18px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {match.round}
              </div>
              <h2
                style={{
                  margin: 0,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 17,
                }}
              >
                Edit Match Players
              </h2>
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
        </div>

        <div style={{ padding: 24 }}>
          {/* Current match players */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Current Players
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 14,
                }}
              >
                1. {playerName(match.player1)}
              </div>
              <div style={{ color: "#94a3b8", fontWeight: 700 }}>vs</div>
              <div
                style={{
                  flex: 1,
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 14,
                  textAlign: "right",
                }}
              >
                2. {playerName(match.player2)}
              </div>
            </div>
          </div>

          {/* Action tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {(
              [
                {
                  key: "replace",
                  label: "🔄 Replace",
                  desc: "Change a player",
                },
                {
                  key: "walkover",
                  label: "🚶 Walkover",
                  desc: "Player withdraws",
                },
                { key: "swap", label: "↔️ Swap", desc: "Swap between matches" },
              ] as const
            ).map(({ key, label, desc }) => (
              <div
                key={key}
                onClick={() => setAction(key)}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: 10,
                  border: `2px solid ${action === key ? "#0f172a" : "#e2e8f0"}`,
                  background: action === key ? "#0f172a" : "#fff",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: action === key ? "#fff" : "#374151",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: action === key ? "#94a3b8" : "#64748b",
                    marginTop: 2,
                  }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Replace action */}
          {action === "replace" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Player 1 Slot
                </label>
                <select
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    color: "#0f172a",
                  }}
                >
                  <option value="">— TBD / Empty —</option>
                  {registeredPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Player 2 Slot
                </label>
                <select
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    color: "#0f172a",
                  }}
                >
                  <option value="">— TBD / Empty —</option>
                  {registeredPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Walkover action */}
          {action === "walkover" && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 12,
                  lineHeight: 1.6,
                }}
              >
                Select which player is giving a walkover. Their opponent will
                automatically advance.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {(["player1", "player2"] as const).map((slot) => (
                  <div
                    key={slot}
                    onClick={() => setWalkoverSlot(slot)}
                    style={{
                      flex: 1,
                      padding: "14px 10px",
                      border: `2px solid ${walkoverSlot === slot ? "#ef4444" : "#e2e8f0"}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "center",
                      background: walkoverSlot === slot ? "#fef2f2" : "#fff",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      {slot === "player1" ? "PLAYER 1" : "PLAYER 2"} WITHDRAWS
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: walkoverSlot === slot ? "#dc2626" : "#0f172a",
                        fontSize: 13,
                      }}
                    >
                      {slot === "player1"
                        ? playerName(match.player1)
                        : playerName(match.player2)}
                    </div>
                    {walkoverSlot === slot && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#16a34a",
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        →{" "}
                        {slot === "player1"
                          ? playerName(match.player2)
                          : playerName(match.player1)}{" "}
                        advances
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Swap action */}
          {action === "swap" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Swap a player from this match with a player from another{" "}
                <strong>{match.round}</strong> match.
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Select Match to Swap With
                </label>
                <select
                  value={swapMatchId}
                  onChange={(e) => setSwapMatchId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    color: "#0f172a",
                  }}
                >
                  <option value="">— Select a match —</option>
                  {sameRoundMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.player1
                        ? `${m.player1.firstName} ${m.player1.lastName}`
                        : "TBD"}{" "}
                      vs{" "}
                      {m.player2
                        ? `${m.player2.firstName} ${m.player2.lastName}`
                        : "TBD"}
                    </option>
                  ))}
                </select>
              </div>
              {swapMatchId && (
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#374151",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Swap their Player 1 (top) or Player 2 (bottom)?
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["player1", "player2"] as const).map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSwapSlot(slot)}
                        style={{
                          flex: 1,
                          padding: "9px 0",
                          border: `2px solid ${swapSlot === slot ? "#0f172a" : "#e2e8f0"}`,
                          borderRadius: 10,
                          background: swapSlot === slot ? "#0f172a" : "#fff",
                          color: swapSlot === slot ? "#fff" : "#374151",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {slot === "player1"
                          ? "Their Player 1"
                          : "Their Player 2"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: 10,
            background: "#f8fafc",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "1.5px solid #e2e8f0",
              borderRadius: 10,
              background: "#fff",
              color: "#475569",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
              padding: "10px 0",
              border: "none",
              borderRadius: 10,
              background: saving
                ? "#94a3b8"
                : action === "walkover"
                  ? "#dc2626"
                  : "#0f172a",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving
              ? "Saving…"
              : action === "replace"
                ? "Update Players"
                : action === "walkover"
                  ? "Confirm Walkover"
                  : "Swap Players"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditKnockoutMatchModal;
