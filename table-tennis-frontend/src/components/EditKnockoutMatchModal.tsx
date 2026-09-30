import React, { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

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
  matchType?: string;
  player1: Player | null;
  player2: Player | null;
  player1Id: string | null;
  player2Id: string | null;
  team1Id?: string | null;
  team2Id?: string | null;
  team1?: Team | null;
  team2?: Team | null;
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
  onClose,
  onSuccess,
}) => {
  const [walkoverSlot, setWalkoverSlot] = useState<"player1" | "player2">(
    "player1",
  );
  const [saving, setSaving] = useState(false);

  const isDoubles =
    match.matchType === "DOUBLES" || Boolean(match.team1Id || match.team2Id);

  const playerName = (p: Player | null) =>
    p ? `${p.firstName} ${p.lastName}` : "TBD";

  const getSlotName = (slot: "player1" | "player2") => {
    if (isDoubles) {
      const team = slot === "player1" ? match.team1 : match.team2;
      if (!team) return "TBD";
      if (team.members && team.members.length > 0) {
        return team.members
          .map((m) => `${m.player.firstName} ${m.player.lastName}`)
          .join(" / ");
      }
      return team.name || "TBD";
    }
    const p = slot === "player1" ? match.player1 : match.player2;
    return playerName(p);
  };

  const p1Name = getSlotName("player1");
  const p2Name = getSlotName("player2");

  const handleConfirmWalkover = async () => {
    setSaving(true);
    try {
      if (isDoubles) {
        const winnerTeamId =
          walkoverSlot === "player1"
            ? match.team2Id || match.team2?.id
            : match.team1Id || match.team1?.id;
        if (!winnerTeamId) {
          toast.error("Cannot award walkover — opponent team slot is empty");
          return;
        }
        await api.patch(`/matches/${match.id}`, {
          status: "WALKOVER",
          winnerTeamId,
          score: "W/O",
        });
        toast.success("Walkover recorded — opponent team advances");
      } else {
        const winnerId =
          walkoverSlot === "player1" ? match.player2Id : match.player1Id;
        if (!winnerId) {
          toast.error("Cannot award walkover — opponent slot is empty");
          return;
        }
        await api.patch(`/matches/${match.id}`, {
          status: "WALKOVER",
          winnerId,
          score: "W/O",
        });
        toast.success("Walkover recorded — opponent advances");
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to record walkover");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
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
          maxWidth: 480,
          boxShadow: "0 25px 70px rgba(0,0,0,0.25)",
          overflow: "hidden",
          fontFamily: "'Segoe UI',system-ui,sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ background: "#0f172a", padding: "20px 24px" }}>
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
                  color: "#38bdf8",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {match.round} • Match Official
              </div>
              <h2
                style={{
                  margin: 0,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: -0.3,
                }}
              >
                Declare Walkover (W/O)
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)",
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
        </div>

        <div style={{ padding: 24 }}>
          {/* Current Match Card */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "14px 18px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Scheduled Match
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  flex: 1,
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 14,
                  lineHeight: 1.3,
                }}
              >
                {p1Name}
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontWeight: 800,
                  fontSize: 12,
                  padding: "2px 8px",
                  background: "#e2e8f0",
                  borderRadius: 6,
                }}
              >
                VS
              </div>
              <div
                style={{
                  flex: 1,
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 14,
                  textAlign: "right",
                  lineHeight: 1.3,
                }}
              >
                {p2Name}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 10,
            }}
          >
            Select participant who is absent or withdrawing:
          </div>

          {/* Participant selection cards */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {(["player1", "player2"] as const).map((slot) => {
              const isSelected = walkoverSlot === slot;
              const slotParticipant = slot === "player1" ? p1Name : p2Name;
              const advancingParticipant = slot === "player1" ? p2Name : p1Name;
              const label =
                slot === "player1"
                  ? isDoubles
                    ? "Team 1"
                    : "Player 1"
                  : isDoubles
                    ? "Team 2"
                    : "Player 2";

              return (
                <div
                  key={slot}
                  onClick={() => setWalkoverSlot(slot)}
                  style={{
                    flex: 1,
                    padding: "16px 14px",
                    border: `2px solid ${isSelected ? "#ef4444" : "#e2e8f0"}`,
                    borderRadius: 14,
                    cursor: "pointer",
                    background: isSelected ? "#fef2f2" : "#ffffff",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 110,
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 9,
                        fontWeight: 800,
                        color: isSelected ? "#dc2626" : "#64748b",
                        background: isSelected ? "#fee2e2" : "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: 4,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      {label} • No-Show
                    </span>
                    <div
                      style={{
                        fontWeight: 800,
                        color: isSelected ? "#991b1b" : "#0f172a",
                        fontSize: 13,
                        lineHeight: 1.3,
                      }}
                    >
                      {slotParticipant}
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: "1px dashed #fca5a5",
                        fontSize: 11,
                        color: "#15803d",
                        fontWeight: 700,
                      }}
                    >
                      ✓ {advancingParticipant} advances (W/O)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Banner */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12,
              color: "#166534",
              lineHeight: 1.5,
            }}
          >
            <strong>Official Rule:</strong> Confirming this walkover will mark
            the match as completed with score <strong>W/O</strong> and
            immediately advance the active participant into the next round.
          </div>
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
              border: "1.5px solid #cbd5e1",
              borderRadius: 10,
              background: "#fff",
              color: "#475569",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmWalkover}
            disabled={saving}
            style={{
              flex: 2,
              padding: "10px 0",
              border: "none",
              borderRadius: 10,
              background: saving ? "#94a3b8" : "#dc2626",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: saving ? "default" : "pointer",
              boxShadow: saving
                ? "none"
                : "0 4px 12px rgba(220, 38, 38, 0.25)",
            }}
          >
            {saving ? "Recording Walkover…" : "Confirm Walkover (W/O)"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditKnockoutMatchModal;
