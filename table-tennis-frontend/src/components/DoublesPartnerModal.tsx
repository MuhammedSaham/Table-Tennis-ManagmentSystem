import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  tournamentId: string;
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onInviteSent?: () => void;
}

const DoublesPartnerModal: React.FC<Props> = ({
  tournamentId,
  categoryId,
  categoryName,
  onClose,
  onInviteSent,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Partner[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [inviteSentTo, setInviteSentTo] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/teams/invites/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data.data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const handleSend = async (inviteeId: string, inviteeName: string) => {
    setSending(inviteeId);
    try {
      await api.post("/teams/invites/send", { tournamentId, categoryId, inviteeId });
      toast.success(`Invite sent to ${inviteeName}!`);
      setInviteSentTo(inviteeName);
      onInviteSent?.();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send invite");
    } finally {
      setSending(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          overflow: "hidden",
          margin: "0 16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
            padding: "22px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
              Doubles Registration
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>
              Find Your Partner
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
              {categoryName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "#fff",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Invite sent success banner */}
          {inviteSentTo && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d" }}>
                  Invite Sent!
                </div>
                <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>
                  Waiting for {inviteSentTo} to accept. They'll see it in their notifications.
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          {!inviteSentTo && (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 20,
                fontSize: 12,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#0f172a" }}>How it works:</strong> Search your partner below → Send invite → They accept via their notifications → Admin approves your team registration.
            </div>
          )}

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              id="partner-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 16px 12px 44px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 18,
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            {searching && (
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                Searching…
              </span>
            )}
          </div>

          {/* Results */}
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                No players found for "{query}"
              </div>
            )}

            {query.trim().length < 2 && (
              <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏓</div>
                Type at least 2 characters to search
              </div>
            )}

            {results.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 10,
                  marginBottom: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                    {p.firstName} {p.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {p.email}
                  </div>
                </div>
                <button
                  id={`invite-btn-${p.id}`}
                  onClick={() => handleSend(p.id, `${p.firstName} ${p.lastName}`)}
                  disabled={!!sending || !!inviteSentTo}
                  style={{
                    background: (sending === p.id || inviteSentTo)
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: (sending === p.id || inviteSentTo) ? "#64748b" : "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: (sending || inviteSentTo) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {sending === p.id ? "Sending…" : "📩 Invite"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 14,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoublesPartnerModal;
