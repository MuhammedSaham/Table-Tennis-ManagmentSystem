import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import toast from "react-hot-toast";

interface AssignRefereeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentRefereeId?: string;
  onSuccess: () => void;
  isGroupMatch?: boolean;
}

export const AssignRefereeModal: React.FC<AssignRefereeModalProps> = ({
  isOpen,
  onClose,
  matchId,
  currentRefereeId,
  onSuccess,
  isGroupMatch,
}) => {
  const [referees, setReferees] = useState<any[]>([]);
  const [selectedReferee, setSelectedReferee] = useState(
    currentRefereeId || "",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReferees();
      setSelectedReferee(currentRefereeId || "");
    }
  }, [isOpen, currentRefereeId]);

  const fetchReferees = async () => {
    try {
      const response = await api.get("/users?role=REFEREE");
      const allUsers = response.data.data.users || response.data.data;
      const filteredReferees = allUsers.filter(
        (u: any) => u.role === "REFEREE",
      );
      setReferees(filteredReferees);
    } catch {
      toast.error("Failed to load referees");
    }
  };

  const handleAssign = async () => {
    if (!selectedReferee) {
      toast.error("Please select a referee");
      return;
    }
    setLoading(true);
    try {
      const endpoint = isGroupMatch
        ? `/groups/group-matches/${matchId}/assign-referee`
        : `/matches/${matchId}/assign-referee`;
      await api.post(endpoint, {
        refereeUserId: selectedReferee,
      });
      toast.success("Referee assigned successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign referee");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-[#4AEEFF]/40 bg-[#061D23]/95 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-6 bg-[#4AEEFF] rounded-full shadow-[0_0_10px_#4AEEFF]" />
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Assign Match Referee
              </h2>
              <p className="text-[11px] text-[#4AEEFF]/80 font-mono mt-0.5">
                Select an official certified umpire for this fixture
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-2">
              Select Match Official
            </label>
            <select
              value={selectedReferee}
              onChange={(e) => setSelectedReferee(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white focus:border-[#4AEEFF] focus:outline-none focus:ring-2 focus:ring-[#4AEEFF]/30 transition-all cursor-pointer"
            >
              <option value="" className="bg-[#061D23] text-white/50">
                -- Choose Referee --
              </option>
              {referees.map((ref: any) => (
                <option
                  key={ref.id}
                  value={ref.id}
                  className="bg-[#061D23] text-white"
                >
                  {ref.firstName} {ref.lastName} ({ref.role})
                </option>
              ))}
            </select>
            {referees.length === 0 && (
              <p className="text-xs text-amber-300 mt-2 font-medium bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                No active referees found in the system.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={loading || !selectedReferee}
              className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-[#061D23] bg-gradient-to-r from-[#4AEEFF] to-[#00b4d8] hover:brightness-110 shadow-md shadow-[#4AEEFF]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Assigning..." : "Assign Referee"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
