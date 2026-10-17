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
  const [selectedReferee, setSelectedReferee] = useState(currentRefereeId || "");
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
        (u: any) => u.role === "REFEREE"
      );
      setReferees(filteredReferees);
    } catch (error) {
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#061D23] px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-[#4AEEFF] rounded-full shadow-[0_0_8px_#4AEEFF]"></span>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                👨‍⚖️ Assign Match Referee
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Select an official umpire for this match</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              Select Match Official
            </label>
            <select
              value={selectedReferee}
              onChange={(e) => setSelectedReferee(e.target.value)}
              className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-white font-bold text-sm focus:border-[#0284c7] focus:ring-4 focus:ring-sky-500/20 outline-none transition-all shadow-sm cursor-pointer"
              style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
            >
              <option value="" style={{ color: "#64748b", backgroundColor: "#ffffff" }}>
                -- Choose Referee --
              </option>
              {referees.map((ref: any) => (
                <option
                  key={ref.id}
                  value={ref.id}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff", fontWeight: 600 }}
                >
                  {ref.firstName} {ref.lastName} ({ref.role})
                </option>
              ))}
            </select>
            {referees.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                No referees found in the system.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={loading || !selectedReferee}
              className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[#4AEEFF] to-[#00b4d8] hover:brightness-110 shadow-md shadow-[#4AEEFF]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Assigning..." : "Assign Referee"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
