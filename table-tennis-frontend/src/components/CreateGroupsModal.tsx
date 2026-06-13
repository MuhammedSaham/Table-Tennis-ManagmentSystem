import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

interface Props {
  tournamentId: string;
  categoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormatOption {
  groups: number;
  label: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

const CreateGroupsModal: React.FC<Props> = ({
  tournamentId,
  categoryId,
  onClose,
  onSuccess,
}) => {
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch approved player count for this category
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get(
          `/tournaments/${tournamentId}/registrations?status=APPROVED&categoryId=${categoryId}`,
        );
        const count = res.data.data?.length ?? 0;
        setPlayerCount(count);
        // Auto-select recommended format
        const recommended = getRecommended(count);
        setSelected(recommended);
      } catch {
        setPlayerCount(null);
      } finally {
        setFetching(false);
      }
    };
    fetchCount();
  }, []);

  const getRecommended = (count: number): number => {
    if (count <= 8) return 2;
    if (count <= 16) return 4;
    if (count <= 24) return 6;
    return 8;
  };

  const getOptions = (count: number | null): FormatOption[] => {
    const recommended = count ? getRecommended(count) : 2;
    return [
      {
        groups: 2,
        icon: "⊞",
        label: "2 Groups",
        description: count
          ? `~${Math.ceil(count / 2)} players/group`
          : "Small tournament",
        recommended: recommended === 2,
      },
      {
        groups: 4,
        icon: "⊟",
        label: "4 Groups",
        description: count
          ? `~${Math.ceil(count / 4)} players/group`
          : "Standard format",
        recommended: recommended === 4,
      },
      {
        groups: 6,
        icon: "⊠",
        label: "6 Groups",
        description: count
          ? `~${Math.ceil(count / 6)} players/group`
          : "Medium tournament",
        recommended: recommended === 6,
      },
      {
        groups: 8,
        icon: "⊡",
        label: "8 Groups",
        description: count
          ? `~${Math.ceil(count / 8)} players/group`
          : "Large tournament",
        recommended: recommended === 8,
      },
    ];
  };

  const handleCreate = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post(
        `/groups/tournaments/${tournamentId}/categories/${categoryId}/groups`,
        { numberOfGroups: selected },
      );
      toast.success(`${selected} groups created successfully!`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to create groups");
    } finally {
      setLoading(false);
    }
  };

  const options = getOptions(playerCount);

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
          maxWidth: 480,
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
            <span style={{ fontSize: 22 }}>🏓</span>
            <h2
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: -0.5,
              }}
            >
              Create Groups
            </h2>
          </div>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
            Choose a format based on your player count
          </p>
        </div>

        <div style={{ padding: 24 }}>
          {/* Player count badge */}
          {fetching ? (
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              Loading player count…
            </div>
          ) : (
            <div
              style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>👥</span>
              <div>
                <div
                  style={{ fontWeight: 700, color: "#0369a1", fontSize: 15 }}
                >
                  {playerCount !== null
                    ? `${playerCount} Approved Players`
                    : "Player count unavailable"}
                </div>
                {playerCount !== null && (
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {playerCount < 4
                      ? "⚠️ Need at least 4 players for groups"
                      : "Ready to create groups"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Format options grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {options.map((opt) => {
              const isSelected = selected === opt.groups;
              return (
                <div
                  key={opt.groups}
                  onClick={() => setSelected(opt.groups)}
                  style={{
                    border: `2px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
                    borderRadius: 14,
                    padding: "16px 14px",
                    cursor: "pointer",
                    background: isSelected ? "#0f172a" : "#fff",
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#e2e8f0";
                  }}
                >
                  {/* Recommended badge */}
                  {opt.recommended && (
                    <div
                      style={{
                        position: "absolute",
                        top: -10,
                        right: 10,
                        background: "#22c55e",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 10,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      Recommended
                    </div>
                  )}

                  {/* Group visual preview */}
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginBottom: 10,
                      justifyContent: "center",
                    }}
                  >
                    {Array.from({ length: opt.groups }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: opt.groups > 4 ? 18 : 24,
                          height: opt.groups > 4 ? 18 : 24,
                          borderRadius: 4,
                          background: isSelected
                            ? "rgba(255,255,255,0.25)"
                            : "#e2e8f0",
                          border: `2px solid ${isSelected ? "rgba(255,255,255,0.4)" : "#cbd5e1"}`,
                        }}
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: isSelected ? "#fff" : "#0f172a",
                      marginBottom: 2,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: isSelected ? "#94a3b8" : "#64748b",
                    }}
                  >
                    {opt.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected summary */}
          {selected && playerCount !== null && (
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 13,
                color: "#475569",
              }}
            >
              <strong style={{ color: "#0f172a" }}>{selected} groups</strong> ·
              ~{Math.ceil(playerCount / selected)} players per group · Top 2
              from each group advance to knockout
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
              disabled={
                loading ||
                !selected ||
                (playerCount !== null && playerCount < 4)
              }
              style={{
                flex: 2,
                padding: "11px 0",
                border: "none",
                borderRadius: 10,
                background: loading || !selected ? "#94a3b8" : "#0f172a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: loading || !selected ? "default" : "pointer",
              }}
            >
              {loading ? "Creating…" : `Create ${selected ?? ""} Groups`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupsModal;
