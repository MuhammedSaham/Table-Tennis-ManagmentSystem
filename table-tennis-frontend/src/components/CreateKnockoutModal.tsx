import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

interface Props {
  tournamentId: string;
  categoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface KnockoutFormat {
  label: string;
  rounds: string[];
  advancingPerGroup: number;
  icon: string;
  color: string;
  description: string;
  recommended?: boolean;
}

const CreateKnockoutModal: React.FC<Props> = ({
  tournamentId,
  categoryId,
  onClose,
  onSuccess,
}) => {
  const [groupCount, setGroupCount] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [selected, setSelected] = useState<number>(2); // advancing per group
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [grpRes, regRes] = await Promise.all([
          api.get(
            `/groups/tournaments/${tournamentId}/categories/${categoryId}/standings`,
          ),
          api.get(
            `/tournaments/${tournamentId}/registrations?status=APPROVED&categoryId=${categoryId}`,
          ),
        ]);
        const groups = grpRes.data.data?.length ?? 0;
        const players = regRes.data.data?.length ?? 0;
        setGroupCount(groups);
        setPlayerCount(players);
        // Auto-select based on groups
        setSelected(groups <= 4 ? 2 : 1);
      } catch {
        setGroupCount(null);
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, []);

  const totalAdvancing = groupCount ? groupCount * selected : 0;

  const getFormat = (advancing: number): KnockoutFormat | null => {
    if (advancing <= 2)
      return {
        label: "Final Only",
        rounds: ["Final"],
        advancingPerGroup: selected,
        icon: "🏆",
        color: "#e11d48",
        description: "2 players go straight to the Final",
      };
    if (advancing <= 4)
      return {
        label: "Semi-Finals",
        rounds: ["Semi-final", "Final"],
        advancingPerGroup: selected,
        icon: "🥊",
        color: "#f97316",
        description: "4 players · 2 rounds",
      };
    if (advancing <= 8)
      return {
        label: "Quarter-Finals",
        rounds: ["Quarter-final", "Semi-final", "Final"],
        advancingPerGroup: selected,
        icon: "⚡",
        color: "#8b5cf6",
        description: "8 players · 3 rounds + 3rd Place",
      };
    if (advancing <= 16)
      return {
        label: "Round of 16",
        rounds: ["R16", "Quarter-final", "Semi-final", "Final"],
        advancingPerGroup: selected,
        icon: "🎯",
        color: "#0369a1",
        description: "16 players · 4 rounds + 3rd Place",
      };
    return null;
  };

  const format = getFormat(totalAdvancing);

  const advancingOptions = groupCount
    ? [1, 2, 3, 4].filter((n) => {
        const total = groupCount * n;
        return total >= 2 && total <= 16;
      })
    : [1, 2];

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post(
        `/groups/tournaments/${tournamentId}/categories/${categoryId}/knockout`,
        { advancingPerGroup: selected },
      );
      toast.success("Knockout stage generated!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to generate knockout stage",
      );
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: 500,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
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
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 22 }}>🏆</span>
            <h2
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: -0.5,
              }}
            >
              Generate Knockout Stage
            </h2>
          </div>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
            Select how many players advance from each group
          </p>
        </div>

        <div style={{ padding: 24 }}>
          {/* Stats row */}
          {fetching ? (
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              Loading group info…
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[
                {
                  label: "Groups",
                  value: groupCount ?? "—",
                  icon: "⊞",
                  color: "#0369a1",
                  bg: "#f0f9ff",
                  border: "#bae6fd",
                },
                {
                  label: "Players",
                  value: playerCount ?? "—",
                  icon: "👥",
                  color: "#166534",
                  bg: "#f0fdf4",
                  border: "#bbf7d0",
                },
                {
                  label: "Advancing",
                  value: totalAdvancing || "—",
                  icon: "⚡",
                  color: "#7c3aed",
                  bg: "#faf5ff",
                  border: "#ddd6fe",
                },
              ].map(({ label, value, icon, color, bg, border }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 12,
                    padding: "12px 10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 20,
                      color,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Advancing per group selector */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#374151",
                marginBottom: 10,
              }}
            >
              Players advancing per group:
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {advancingOptions.map((n) => {
                const total = (groupCount ?? 0) * n;
                const fmt = getFormat(total);
                const isSel = selected === n;
                return (
                  <div
                    key={n}
                    onClick={() => setSelected(n)}
                    style={{
                      flex: 1,
                      border: `2px solid ${isSel ? "#0f172a" : "#e2e8f0"}`,
                      borderRadius: 12,
                      padding: "12px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: isSel ? "#0f172a" : "#fff",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel)
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "#94a3b8";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel)
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "#e2e8f0";
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: isSel ? "#fff" : "#0f172a",
                        lineHeight: 1,
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: isSel ? "#94a3b8" : "#64748b",
                        marginTop: 2,
                        fontWeight: 600,
                      }}
                    >
                      {total} total
                    </div>
                    {fmt && (
                      <div
                        style={{
                          fontSize: 9,
                          color: isSel ? fmt.color : "#94a3b8",
                          fontWeight: 700,
                          marginTop: 4,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {fmt.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format preview */}
          {format && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>{format.icon}</span>
                <div>
                  <div
                    style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}
                  >
                    {format.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {format.description}
                  </div>
                </div>
              </div>

              {/* Round flow diagram */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    background: "#e2e8f0",
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  Group Stage
                </div>
                {format.rounds.map((r, i) => (
                  <React.Fragment key={r}>
                    <span style={{ color: "#94a3b8", fontSize: 14 }}>→</span>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        background:
                          i === format.rounds.length - 1
                            ? "#e11d48"
                            : "#475569",
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {r}
                    </div>
                  </React.Fragment>
                ))}
                <span style={{ color: "#94a3b8", fontSize: 14 }}>→</span>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#b45309",
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  3rd Place
                </div>
              </div>
            </div>
          )}

          {/* Warning if groups not complete */}
          {!fetching && groupCount === 0 && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#b91c1c",
              }}
            >
              ⚠️ No groups found. Please create groups first.
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px 0",
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
              onClick={handleCreate}
              disabled={loading || groupCount === 0 || !format}
              style={{
                flex: 2,
                padding: "11px 0",
                border: "none",
                borderRadius: 10,
                background: loading || groupCount === 0 ? "#94a3b8" : "#0f172a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: loading || groupCount === 0 ? "default" : "pointer",
              }}
            >
              {loading
                ? "Generating…"
                : `Generate ${format?.label ?? "Knockout"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateKnockoutModal;
