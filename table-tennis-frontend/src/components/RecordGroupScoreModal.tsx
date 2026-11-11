import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

interface GroupMatch {
  id: string;
  player1?: { firstName: string; lastName: string } | null;
  player2?: { firstName: string; lastName: string } | null;
  team1?: {
    name: string;
    members?: Array<{ player?: { firstName: string; lastName: string } }>;
  } | null;
  team2?: {
    name: string;
    members?: Array<{ player?: { firstName: string; lastName: string } }>;
  } | null;
  player1Score: number | null;
  player2Score: number | null;
  status: string;
}

interface RecordGroupScoreModalProps {
  tournamentId: string;
  categoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const getParticipantName = (team?: any, player?: any) => {
  if (team?.members && team.members.length >= 2) {
    const p1 = team.members[0]?.player;
    const p2 = team.members[1]?.player;
    if (p1 && p2) return `${p1.firstName} ${p1.lastName} & ${p2.firstName} ${p2.lastName}`;
  }
  if (team?.name) return team.name;
  if (player) return `${player.firstName} ${player.lastName}`;
  return "TBD";
};

const RecordGroupScoreModal: React.FC<RecordGroupScoreModalProps> = ({
  tournamentId,
  categoryId,
  onClose,
  onSuccess,
}) => {
  const [matches, setMatches] = useState<GroupMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [scores, setScores] = useState<{
    [key: string]: { player1Score: number; player2Score: number };
  }>({});

  useEffect(() => {
    fetchGroupMatches();
  }, [tournamentId, categoryId]);

  const fetchGroupMatches = async () => {
    try {
      const response = await api.get(
        `/groups/tournaments/${tournamentId}/categories/${categoryId}/matches`,
      );
      setMatches(response.data.data);

      // Initialize scores
      const initialScores: any = {};
      response.data.data.forEach((match: GroupMatch) => {
        if (match.player1Score !== null && match.player2Score !== null) {
          initialScores[match.id] = {
            player1Score: match.player1Score,
            player2Score: match.player2Score,
          };
        }
      });
      setScores(initialScores);
    } catch (error) {
      toast.error("Failed to fetch group matches");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (
    matchId: string,
    player: "player1" | "player2",
    value: string,
  ) => {
    const numValue = value === "" ? 0 : parseInt(value);
    setScores({
      ...scores,
      [matchId]: {
        ...scores[matchId],
        [player === "player1" ? "player1Score" : "player2Score"]: numValue,
      },
    });
  };

  const handleSubmitScore = async (matchId: string) => {
    const score = scores[matchId];
    if (!score) return;

    setSubmitting(matchId);
    try {
      await api.patch(`/groups/group-matches/${matchId}`, {
        player1Score: score.player1Score,
        player2Score: score.player2Score,
      });
      toast.success("Score recorded successfully!");
      fetchGroupMatches();
      onSuccess();
    } catch (error) {
      toast.error("Failed to record score");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Record Group Stage Scores
        </h2>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No group matches found. Generate matches first.
            </p>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getParticipantName(match.team1, match.player1)}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={scores[match.id]?.player1Score ?? ""}
                      onChange={(e) =>
                        handleScoreChange(match.id, "player1", e.target.value)
                      }
                      className="w-16 px-2 py-1 text-center border rounded"
                      placeholder="0"
                    />
                    <span className="font-bold text-gray-500">vs</span>
                    <input
                      type="number"
                      value={scores[match.id]?.player2Score ?? ""}
                      onChange={(e) =>
                        handleScoreChange(match.id, "player2", e.target.value)
                      }
                      className="w-16 px-2 py-1 text-center border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-medium text-gray-900">
                      {getParticipantName(match.team2, match.player2)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-right">
                  <button
                    onClick={() => handleSubmitScore(match.id)}
                    disabled={submitting === match.id}
                    className="bg-primary-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    {submitting === match.id ? "Saving..." : "Save Score"}
                  </button>
                </div>

                {match.status === "COMPLETED" && (
                  <div className="mt-2 text-xs text-green-600">
                    ✓ Completed - Winner:{" "}
                    {match.player1Score! > match.player2Score!
                      ? getParticipantName(match.team1, match.player1)
                      : getParticipantName(match.team2, match.player2)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordGroupScoreModal;
