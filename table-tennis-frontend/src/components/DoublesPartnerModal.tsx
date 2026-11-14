import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  playerProfile?: {
    gender?: string;
    skillLevel?: string;
    clubAffiliation?: string;
  };
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

  // Debounced search with category filter
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(
          `/teams/invites/search?q=${encodeURIComponent(query.trim())}&categoryId=${encodeURIComponent(categoryId)}`
        );
        setResults(res.data.data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query, categoryId]);

  const handleSend = async (inviteeId: string, inviteeName: string) => {
    setSending(inviteeId);
    try {
      await api.post("/teams/invites/send", { tournamentId, categoryId, inviteeId });
      toast.success(`Invitation sent to ${inviteeName}!`);
      setInviteSentTo(inviteeName);
      onInviteSent?.();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send invite");
    } finally {
      setSending(null);
    }
  };

  const getInitials = (first?: string, last?: string) => {
    const f = first?.[0] || "";
    const l = last?.[0] || "";
    return (f + l).toUpperCase() || "TT";
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#082028] border border-cyan-500/25 rounded-2xl w-full max-w-lg shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b2b36] via-[#0e3542] to-[#082028] px-6 py-5 border-b border-cyan-500/20 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Doubles Pairing
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <span>Find Your Partner</span>
            </h2>
            <p className="text-xs text-cyan-200/70 mt-0.5">
              Category: <span className="text-white font-medium">{categoryName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Invite sent confirmation */}
          {inviteSentTo ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 animate-in fade-in">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="text-sm font-bold text-emerald-300">
                  Invitation Sent to {inviteSentTo}!
                </div>
                <div className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  As soon as {inviteSentTo} clicks <strong>Accept</strong> on this tournament, your doubles team will be officially confirmed and ready for the bracket!
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/15 text-xs text-cyan-100/80 leading-relaxed flex items-center gap-2.5">
              <span className="text-cyan-400 text-base">💡</span>
              <div>
                Search a registered college player below and click <strong className="text-cyan-300">Invite</strong>. When they accept, your pair is automatically enrolled!
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <input
              id="doubles-partner-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partner by name or email..."
              autoFocus
              className="w-full bg-[#05171d] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/60 pointer-events-none text-base">
              🔍
            </span>
            {searching && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-cyan-400 animate-pulse">
                Searching...
              </span>
            )}
          </div>

          {/* Results List */}
          <div className="space-y-2 min-h-[160px] max-h-[260px] overflow-y-auto pr-1">
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                <div className="text-3xl mb-2 opacity-50">👤</div>
                No eligible players found matching &ldquo;{query}&rdquo;
                <div className="text-[11px] text-slate-500 mt-1">
                  (Players already registered or of ineligible gender are hidden)
                </div>
              </div>
            )}

            {query.trim().length < 2 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                <div className="text-3xl mb-2 opacity-50">🏓</div>
                Type at least 2 characters to search registered players
              </div>
            )}

            {results.map((p) => {
              const gender = p.playerProfile?.gender;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#061920] border border-cyan-500/15 hover:border-cyan-500/35 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-teal-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-inner">
                      {getInitials(p.firstName, p.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
                        <span>
                          {p.firstName} {p.lastName}
                        </span>
                        {gender && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              gender === "MALE"
                                ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                                : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {gender === "MALE" ? "♂ Male" : "♀ Female"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{p.email}</div>
                    </div>
                  </div>

                  <button
                    id={`invite-partner-btn-${p.id}`}
                    onClick={() => handleSend(p.id, `${p.firstName} ${p.lastName}`)}
                    disabled={!!sending || !!inviteSentTo}
                    className={`ml-3 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                      sending === p.id || inviteSentTo
                        ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-[0_4px_12px_rgba(74,238,255,0.25)] active:scale-95"
                    }`}
                  >
                    {sending === p.id ? "Sending..." : "📩 Send Invite"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#05171d]/80 border-t border-cyan-500/15 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {inviteSentTo ? "✅ Ready to close" : "Pairing is confirmed upon partner acceptance"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            {inviteSentTo ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoublesPartnerModal;
