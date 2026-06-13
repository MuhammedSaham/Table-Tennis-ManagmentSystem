import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  ranking?: number;
  profileImage?: string;
  createdAt: string;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
  };
}

const skillColors: Record<string, { bg: string; text: string }> = {
  BEGINNER: { bg: "#e0f2fe", text: "#0369a1" },
  INTERMEDIATE: { bg: "#fef3c7", text: "#92400e" },
  ADVANCED: { bg: "#dcfce7", text: "#166534" },
  PROFESSIONAL: { bg: "#ede9fe", text: "#4c1d95" },
};

const calculateAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filtered, setFiltered] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("ALL");

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    let result = players;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.playerProfile?.clubAffiliation?.toLowerCase().includes(q),
      );
    }
    if (skillFilter !== "ALL") {
      result = result.filter(
        (p) => p.playerProfile?.skillLevel?.toUpperCase() === skillFilter,
      );
    }
    setFiltered(result);
  }, [search, skillFilter, players]);

  const fetchPlayers = async () => {
    try {
      const res = await api.get("/users/public/players");
      setPlayers(res.data.data);
      setFiltered(res.data.data);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const initials = (p: Player) =>
    `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 16px 80px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #e11d48, #f97316)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🏓
          </div>
          <h1
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 900,
              color: "#0f172a",
              margin: 0,
              letterSpacing: -1,
            }}
          >
            Players
          </h1>
        </div>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Browse all registered players and view their profiles
        </p>
      </div>

      {/* ── Filters ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 28,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              color: "#94a3b8",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name or club..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 42,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              border: "1.5px solid #e2e8f0",
              borderRadius: 12,
              fontSize: 14,
              outline: "none",
              color: "#1e293b",
              background: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Skill filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setSkillFilter(s)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "1.5px solid",
                  borderColor: skillFilter === s ? "#e11d48" : "#e2e8f0",
                  background: skillFilter === s ? "#e11d48" : "#fff",
                  color: skillFilter === s ? "#fff" : "#64748b",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  letterSpacing: 0.3,
                  transition: "all 0.15s",
                }}
              >
                {s === "ALL"
                  ? "All Levels"
                  : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ),
          )}
        </div>

        {/* Count */}
        <span style={{ color: "#94a3b8", fontSize: 13, marginLeft: "auto" }}>
          {filtered.length} player{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: 80 }}>
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
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading players…</p>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            background: "#f8fafc",
            borderRadius: 20,
            border: "1px dashed #cbd5e1",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏓</div>
          <p style={{ color: "#64748b", fontSize: 16, fontWeight: 600 }}>
            No players found
          </p>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Try adjusting your search or filter
          </p>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((player) => {
            const skill = player.playerProfile?.skillLevel?.toUpperCase();
            const skillStyle =
              skill && skillColors[skill]
                ? skillColors[skill]
                : { bg: "#f1f5f9", text: "#475569" };
            const age = player.playerProfile?.dateOfBirth
              ? calculateAge(player.playerProfile.dateOfBirth)
              : null;

            return (
              <Link
                key={player.id}
                to={`/profile/${player.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "#fff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 18,
                    padding: 24,
                    transition: "all 0.2s",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "#e11d48";
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 8px 24px rgba(225,29,72,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "#e2e8f0";
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                  }}
                >
                  {/* top accent */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: "linear-gradient(90deg, #e11d48, #f97316)",
                      borderRadius: "18px 18px 0 0",
                    }}
                  />

                  {/* Avatar + Name */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 16,
                    }}
                  >
                    {player.profileImage ? (
                      <img
                        src={player.profileImage}
                        alt={player.firstName}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #f1f5f9",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #0f172a, #1e293b)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 18,
                          flexShrink: 0,
                          letterSpacing: -0.5,
                        }}
                      >
                        {initials(player)}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 800,
                          color: "#0f172a",
                          fontSize: 16,
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {player.firstName} {player.lastName}
                      </p>
                      {player.ranking !== undefined && (
                        <p
                          style={{
                            color: "#e11d48",
                            fontSize: 12,
                            fontWeight: 700,
                            margin: "4px 0 0",
                          }}
                        >
                          Rank #{player.ranking}
                        </p>
                      )}
                      {age !== null && (
                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                            margin: "2px 0 0",
                          }}
                        >
                          {age} years old
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Club */}
                  {player.playerProfile?.clubAffiliation && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>🏓</span>
                      <span
                        style={{
                          color: "#475569",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {player.playerProfile.clubAffiliation}
                      </span>
                    </div>
                  )}

                  {/* Skill badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {skill ? (
                      <span
                        style={{
                          background: skillStyle.bg,
                          color: skillStyle.text,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 12px",
                          borderRadius: 20,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        {player.playerProfile?.skillLevel}
                      </span>
                    ) : (
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>
                        No level set
                      </span>
                    )}
                    <span
                      style={{
                        color: "#e11d48",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Players;
