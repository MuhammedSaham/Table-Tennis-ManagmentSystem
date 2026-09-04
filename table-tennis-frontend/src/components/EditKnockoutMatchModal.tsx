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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
      >
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-950/80 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/80">
                {match.round}
              </div>
              <h2 className="m-0 text-lg font-extrabold text-white">
                Edit Match Players
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:bg-white/10"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Current match players */}
          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Current Players
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1 font-bold text-slate-100">
                1. {playerName(match.player1)}
              </div>
              <div className="font-bold uppercase tracking-wide text-slate-500">
                VS
              </div>
              <div className="flex-1 text-right font-bold text-slate-100">
                2. {playerName(match.player2)}
              </div>
            </div>
          </div>

          {/* Action tabs */}
          <div className="grid grid-cols-3 gap-2">
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
                className={`cursor-pointer rounded-xl border p-2 text-center transition ${
                  action === key
                    ? "border-cyan-400/40 bg-cyan-500/15 shadow-lg shadow-cyan-500/10"
                    : "border-slate-700 bg-slate-950/60 hover:border-cyan-400/25"
                }`}
              >
                <div className={`text-[13px] font-bold ${action === key ? "text-cyan-100" : "text-slate-200"}`}>
                  {label}
                </div>
                <div className={`mt-0.5 text-[10px] ${action === key ? "text-cyan-200/70" : "text-slate-400"}`}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Replace action */}
          {action === "replace" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Player 1 Slot
                </label>
                <select
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
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
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Player 2 Slot
                </label>
                <select
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
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
              <div className="mb-3 text-sm leading-6 text-slate-300">
                Select which player is giving a walkover. Their opponent will
                automatically advance.
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(["player1", "player2"] as const).map((slot) => (
                  <div
                    key={slot}
                    onClick={() => setWalkoverSlot(slot)}
                    className={`cursor-pointer rounded-xl border p-3 text-center transition ${
                      walkoverSlot === slot
                        ? "border-rose-400/40 bg-rose-500/10"
                        : "border-slate-700 bg-slate-950/60 hover:border-rose-400/25"
                    }`}
                  >
                    <div className="mb-1 text-[11px] font-semibold text-slate-400">
                      {slot === "player1" ? "PLAYER 1" : "PLAYER 2"} WITHDRAWS
                    </div>
                    <div className={`text-sm font-bold ${walkoverSlot === slot ? "text-rose-200" : "text-slate-100"}`}>
                      {slot === "player1"
                        ? playerName(match.player1)
                        : playerName(match.player2)}
                    </div>
                    {walkoverSlot === slot && (
                      <div className="mt-1 text-[11px] font-semibold text-emerald-300">
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
            <div className="space-y-3">
              <div className="text-sm leading-6 text-slate-300">
                Swap a player from this match with a player from another{" "}
                <strong>{match.round}</strong> match.
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Select Match to Swap With
                </label>
                <select
                  value={swapMatchId}
                  onChange={(e) => setSwapMatchId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
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
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Swap their Player 1 (top) or Player 2 (bottom)?
                  </label>
                  <div className="flex gap-2">
                    {(["player1", "player2"] as const).map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSwapSlot(slot)}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                          swapSlot === slot
                            ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                            : "border-slate-700 bg-slate-950/60 text-slate-200 hover:border-cyan-400/25"
                        }`}
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
        <div className="flex gap-3 border-t border-slate-700 bg-slate-950/80 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-600 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-[2] rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${
              saving
                ? "cursor-default bg-slate-500"
                : action === "walkover"
                  ? "bg-rose-600 hover:bg-rose-500"
                  : "bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 hover:shadow-lg hover:shadow-cyan-500/25"
            }`}
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
