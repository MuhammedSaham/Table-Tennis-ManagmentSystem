import React, { useState, useEffect } from "react";
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
        (u: any) => u.role === "REFEREE" || u.role === "ADMIN"
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Assign Referee</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ×
          </button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Match Official</label>
          <select
            value={selectedReferee}
            onChange={(e) => setSelectedReferee(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all font-medium"
          >
            <option value="">-- Choose Referee --</option>
            {referees.map((ref: any) => (
              <option key={ref.id} value={ref.id}>
                {ref.firstName} {ref.lastName}
              </option>
            ))}
          </select>
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedReferee}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Assigning..." : "Assign Referee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
