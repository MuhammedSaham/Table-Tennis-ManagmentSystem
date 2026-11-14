import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import BackButton from "../components/BackButton";
import GlassSelect from "../components/GlassSelect";
import { UmpireSheet } from "../components/GroupStandings";
import type { GroupMatch, GameScore } from "../components/GroupStandings";
import { UmpireSheet as KnockoutUmpireSheet } from "../components/KnockoutBracket";
import {
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import invertedLogo from "../assets/Logo  with Name inverted.png";
import darkLogo from "../assets/Logo  with Name.png";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

interface Team {
  id: string;
  name: string;
  members?: {
    player: Player;
  }[];
}

const getParticipantName = (
  player?: Player | null,
  team?: Team | null,
): string => {
  if (team) {
    const memberNames = team.members
      ?.map((member) =>
        `${member.player.firstName} ${member.player.lastName}`.trim(),
      )
      .filter(Boolean)
      .join(" / ");

    return memberNames || team.name || "TBD";
  }

  return player ? `${player.firstName} ${player.lastName}`.trim() : "TBD";
};

interface RefereeStatistics {
  groupStageMinutes: number;
  knockoutStageMinutes: number;
  totalWorkingMinutes: number;
  totalWorkingTime: string;
}

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  startTime?: string | null;
  endTime?: string | null;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "WALKOVER";
  score: string | null;
  winnerId: string | null;
  player1: Player | null;
  player2: Player | null;
  player1Id: string | null;
  player2Id: string | null;
  team1?: Team | null;
  team2?: Team | null;
  tournament: {
    id: string;
    name: string;
    venue: string;
  };
  category: {
    name: string;
    type: string;
  };
  referee?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  isGroupMatch?: boolean;
}

const getMatchDurationMinutes = (match: Match): number | null => {
  if (!match.startTime || !match.endTime) return null;

  const start = new Date(match.startTime).getTime();
  const end = new Date(match.endTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.round((end - start) / 60000);
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
};

const RefereeMatches: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [refereeStats, setRefereeStats] = useState<RefereeStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">(
    "pending",
  );
  const [matchType, setMatchType] = useState<"knockout" | "group">("knockout");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState("ALL");
  const [selectedCategoryName, setSelectedCategoryName] = useState("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showPaymentVoucherModal, setShowPaymentVoucherModal] = useState(false);

  const handlePrintDutyLog = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "794px";
    iframe.style.height = "1123px";
    iframe.style.border = "0";
    iframe.style.opacity = "0.01";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const completedMatches = matches.filter((m) => m.status === "COMPLETED");
    const refereeName = user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Official Match Referee";
    const refereeEmail = user?.email || "referee@samscollege.com";
    const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: "long" });
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const durationStr = refereeStats
      ? formatDuration(refereeStats.totalWorkingMinutes)
      : formatDuration(totalOfficiatingMinutes);
    const koCount = matches.filter((m) => !m.isGroupMatch).length;
    const grpCount = matches.filter((m) => m.isGroupMatch).length;

    const rowsHtml = completedMatches.length === 0
      ? `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">No completed matches recorded for this duty period yet.</td></tr>`
      : completedMatches.map((m, idx) => {
          const p1 = getParticipantName(m.player1, m.team1);
          const p2 = getParticipantName(m.player2, m.team2);
          const dur = getMatchDurationMinutes(m);
          return `
            <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
              <td style="padding: 5px 8px; font-weight: bold; color: #0284c7; text-align: center;">#${idx + 1}</td>
              <td style="padding: 5px 8px;">
                <div style="font-weight: 700; color: #0f172a; font-size: 10.5px;">${m.tournament?.name || "Tournament"}</div>
                <div style="color: #64748b; font-size: 9px;">${m.round || "Round"} · Match #${m.matchNumber}</div>
              </td>
              <td style="padding: 5px 8px; font-weight: 600; color: #0f172a; font-size: 10.5px;">
                ${p1} <span style="color: #0284c7; font-weight: 800;">vs</span> ${p2}
              </td>
              <td style="padding: 5px 8px; text-align: center; font-weight: 800; color: #0f172a; font-family: monospace; font-size: 10.5px;">
                ${m.score || "—"}
              </td>
              <td style="padding: 5px 8px; text-align: right; color: #475569; font-family: monospace; font-size: 10px;">
                ${dur !== null ? `${dur} min` : "—"}
              </td>
            </tr>
          `;
        }).join("");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <base href="${window.location.origin}/" />
          <title>Official Referee Officiating Log - Sam's College</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              padding: 0;
              margin: 0;
              width: 100%;
              font-size: 11px;
              line-height: 1.35;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page-container {
              width: 100%;
              max-width: 100%;
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 12px 16px;
              background: #ffffff;
              box-sizing: border-box;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 8px;
              border-bottom: 1.5px solid #0f172a;
              margin-bottom: 8px;
            }
            .logo-box {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo-img {
              height: 36px;
              width: auto;
              object-fit: contain;
            }
            .title-box h1 {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #0f172a;
            }
            .title-box p {
              font-size: 9.5px;
              font-weight: 600;
              color: #0284c7;
              font-family: monospace;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              padding: 6px 10px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              margin-bottom: 8px;
            }
            .meta-label {
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
            }
            .meta-value {
              font-size: 10px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .meta-sub {
              font-size: 8px;
              color: #64748b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .summary-strip {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              padding: 6px 10px;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              margin-bottom: 8px;
            }
            .summary-val {
              font-size: 11.5px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 1px;
            }
            .section-title {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #0f172a;
              margin-bottom: 4px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              overflow: hidden;
              margin-bottom: 8px;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th {
              background: #f1f5f9;
              color: #0f172a;
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 4px 8px;
              border-bottom: 1.5px solid #94a3b8;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              padding-top: 6px;
              border-top: 1.5px solid #0f172a;
              margin-top: 6px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .sig-line {
              border-bottom: 1px solid #475569;
              padding-bottom: 2px;
              margin-top: 12px;
              font-style: italic;
              font-size: 10px;
              color: #0f172a;
              font-weight: 600;
            }
            .sig-title {
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
            }
            .sig-desc {
              font-size: 8px;
              color: #64748b;
              margin-top: 1px;
            }
            .footer-note {
              margin-top: 6px;
              font-size: 7.5px;
              color: #94a3b8;
              text-align: center;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header">
              <div class="logo-box">
                <img src="${darkLogo}" alt="Sam's College" class="logo-img" />
                <div style="height: 26px; width: 1px; background: #cbd5e1;"></div>
                <div class="title-box">
                  <h1>Official Referee Officiating Log</h1>
                  <p>Tournament Officiating Timesheet & Verified Match Record</p>
                </div>
              </div>
              <div style="text-align: right; font-size: 8.5px; color: #64748b; font-family: monospace;">
                <div>OFFICIAL RECORD</div>
                <div style="font-weight: bold; color: #0284c7;">ITTF CERTIFIED</div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <div class="meta-label">Officiating Referee</div>
                <div class="meta-value">${refereeName}</div>
                <div class="meta-sub">${refereeEmail}</div>
              </div>
              <div>
                <div class="meta-label">Date of Log</div>
                <div class="meta-value">${dateStr}</div>
                <div class="meta-sub">${timeStr}</div>
              </div>
              <div>
                <div class="meta-label">Duty Status</div>
                <div class="meta-value" style="color: #047857;">● Certified Active Duty</div>
                <div class="meta-sub">Official Record Verified</div>
              </div>
              <div>
                <div class="meta-label">Officiating Time</div>
                <div class="meta-value" style="color: #0284c7;">${durationStr}</div>
                <div class="meta-sub">Total Active Officiating</div>
              </div>
            </div>

            <div class="summary-strip">
              <div>
                <div class="meta-label">Total Assigned</div>
                <div class="summary-val">${matches.length} Fixtures</div>
              </div>
              <div>
                <div class="meta-label">Pending / Live</div>
                <div class="summary-val" style="color: #b45309;">${pendingCount} Fixtures</div>
              </div>
              <div>
                <div class="meta-label">Completed</div>
                <div class="summary-val" style="color: #047857;">${completedCount} Verified</div>
              </div>
              <div>
                <div class="meta-label">Stage Split</div>
                <div class="summary-val" style="font-size: 11px; font-family: monospace;">KO: ${koCount} | Grp: ${grpCount}</div>
              </div>
            </div>

            <div class="section-title">
              <span>Itemized Completed Matches (${completedMatches.length})</span>
              <span style="font-size: 8.5px; font-weight: normal; color: #64748b; font-family: monospace;">All Scores Official & Verified</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30px; text-align: center;">#</th>
                  <th style="text-align: left;">Tournament & Round</th>
                  <th style="text-align: left;">Competitors</th>
                  <th style="text-align: center; width: 90px;">Score</th>
                  <th style="text-align: right; width: 75px;">Duration</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="signatures">
              <div>
                <div class="sig-title">Officiating Referee</div>
                <div class="sig-line">${refereeName}</div>
                <div class="sig-desc">Signed & Submitted by Officiating Referee</div>
              </div>
              <div>
                <div class="sig-title">Tournament Director / Head Official</div>
                <div class="sig-line">[ Verified Official Match Record ]</div>
                <div class="sig-desc">Authorized Signature & Club Seal</div>
              </div>
            </div>

            <div class="footer-note">
              Official Sam's College Table Tennis Management System · Certified Match Officiating Timesheet
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 250);
  };

  useEffect(() => {
    fetchAssignedMatches();
  }, []);

  const fetchAssignedMatches = async () => {
    try {
      const [matchesResponse, dashboardResponse] = await Promise.all([
        api.get("/matches/my-assigned-matches"),
        api.get("/dashboard/referee"),
      ]);

      setMatches(matchesResponse.data.data || []);
      setRefereeStats(dashboardResponse.data.data.statistics);
    } catch (error) {
      console.error("Failed to load referee dashboard", error);
      toast.error("Failed to load referee dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupMatchSave = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
    startTime?: string,
    endTime?: string,
  ) => {
    try {
      const toDateTime = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date;
      };

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (startTime && endTime) {
        startDate = toDateTime(startTime);
        endDate = toDateTime(endTime);

        // Handle matches that finish after midnight
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
      }
      const gamesPayload = games.map((game) => ({
        p1: game.p1 === "" || game.p1 == null ? null : Number(game.p1),
        p2: game.p2 === "" || game.p2 == null ? null : Number(game.p2),
      }));

      console.log("Converted games:", gamesPayload);
      console.log("Best of:", bestOf);

      await api.patch(`/groups/group-matches/${matchId}`, {
        games,
        bestOf,
        ...(startDate && {
          startTime: startDate.toISOString(),
        }),
        ...(endDate && {
          endTime: endDate.toISOString(),
        }),
      });

      console.log("Games sent to backend:", games);
      console.log("Best of:", bestOf);

      toast.success("Score recorded successfully");
      await fetchAssignedMatches();
      setSelectedMatch(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record score");
    }
  };

  const handleKnockoutMatchSave = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
    startTime?: string,
    endTime?: string,
  ) => {
    const match = matches.find((m) => m.id === matchId);
    const isDoubles =
      match?.category?.type === "DOUBLES" ||
      (!!match?.team1 && !match?.player1);

    const slot1Filled = isDoubles ? !!match?.team1 : !!match?.player1?.id;
    const slot2Filled = isDoubles ? !!match?.team2 : !!match?.player2?.id;
    if (!slot1Filled || !slot2Filled) {
      toast.error("Both players required");
      return;
    }

    const wn = Math.ceil(bestOf / 2);
    let p1W = 0,
      p2W = 0;
    const parts: string[] = [];
    for (const g of games) {
      if (!g.p1 || !g.p2) continue;
      const a = parseInt(g.p1),
        b = parseInt(g.p2);
      parts.push(`${a}-${b}`);
      if (a > b) p1W++;
      else p2W++;
    }
    if (p1W < wn && p2W < wn) {
      toast.error(`Need ${wn} wins`);
      return;
    }

    const winnerId = !isDoubles
      ? p1W > p2W
        ? match!.player1!.id
        : match!.player2!.id
      : undefined;

    const winnerTeamId = isDoubles
      ? p1W > p2W
        ? match!.team1!.id
        : match!.team2!.id
      : undefined;

    const matchDate = match?.scheduledTime
      ? new Date(match.scheduledTime)
      : new Date();

    const toDateTime = (time?: string) => {
      if (!time) return undefined;

      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date(matchDate);
      date.setHours(hours, minutes, 0, 0);

      return date;
    };

    const startDate = toDateTime(startTime);
    const endDate = toDateTime(endTime);

    if (startDate && endDate && endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const durationMinutes =
      startDate && endDate
        ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
        : null;

    try {
      await api.patch(`/matches/${matchId}`, {
        score: parts.join(", "),
        winnerId,
        winnerTeamId,
        status: "COMPLETED",
        ...(startDate ? { startTime: startDate.toISOString() } : {}),
        ...(endDate ? { endTime: endDate.toISOString() } : {}),
        resultDetails: {
          bestOf,
          ...(durationMinutes !== null ? { durationMinutes } : {}),
        },
      });

      toast.success("Score saved successfully!");
      fetchAssignedMatches();
      setSelectedMatch(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record score");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-sky-500/20 text-sky-300 border border-sky-400/30";
      case "ONGOING":
        return "bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse";
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
      case "CANCELLED":
      case "WALKOVER":
        return "bg-rose-500/20 text-rose-300 border border-rose-400/30";
      default:
        return "bg-white/10 text-white/80 border border-white/20";
    }
  };

  const uniqueTournaments = Array.from(
    new Map(
      matches
        .filter((m) => m.tournament?.id)
        .map((m) => [m.tournament.id, m.tournament]),
    ).values(),
  );

  const uniqueCategories = Array.from(
    new Set(matches.map((m) => m.category?.name).filter(Boolean)),
  ) as string[];

  const filteredMatches = matches.filter((m) => {
    if (
      filter === "pending" &&
      m.status !== "SCHEDULED" &&
      m.status !== "ONGOING"
    )
      return false;
    if (filter === "completed" && m.status !== "COMPLETED") return false;

    if (matchType === "knockout" && m.isGroupMatch) return false;
    if (matchType === "group" && !m.isGroupMatch) return false;

    if (
      selectedTournamentId !== "ALL" &&
      m.tournament?.id !== selectedTournamentId
    ) {
      return false;
    }

    if (
      selectedCategoryName !== "ALL" &&
      m.category?.name !== selectedCategoryName
    ) {
      return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const p1 = getParticipantName(m.player1, m.team1).toLowerCase();
      const p2 = getParticipantName(m.player2, m.team2).toLowerCase();
      const round = (m.round || "").toLowerCase();
      const matchNum = `match #${m.matchNumber}`.toLowerCase();
      const tourney = (m.tournament?.name || "").toLowerCase();
      const cat = (m.category?.name || "").toLowerCase();

      if (
        !p1.includes(q) &&
        !p2.includes(q) &&
        !round.includes(q) &&
        !matchNum.includes(q) &&
        !String(m.matchNumber).includes(q) &&
        !tourney.includes(q) &&
        !cat.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  const wrapInBaseLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white print:bg-white print:min-h-0 print:p-0 print:m-0 print:overflow-visible">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat no-print print:hidden"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      {/* Light overlay for text legibility over the paper-texture artwork */}
      <div className="fixed inset-0 bg-[#061D23]/25 no-print print:hidden" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 no-print print:hidden" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-5 px-4 sm:px-6 lg:px-10 xl:px-14 pt-1 sm:pt-2 pb-8 sm:pb-12 print:min-h-0 print:max-w-full print:p-0 print:m-0 print:space-y-0">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading assigned matches...
        </p>
      </div>,
    );
  }

  const getInitials = (name?: string | null) => {
    if (!name || name === "TBD") return "TT";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const pendingCount = matches.filter(
    (m) => m.status === "SCHEDULED" || m.status === "ONGOING",
  ).length;
  const completedCount = matches.filter((m) => m.status === "COMPLETED").length;

  const totalOfficiatingMinutes = matches.reduce((total, match) => {
    if (match.status !== "COMPLETED") return total;

    const duration = getMatchDurationMinutes(match);

    return total + (duration ?? 0);
  }, 0);

  const nextPendingMatch =
    matches.find((m) => m.status === "ONGOING") ||
    matches.find((m) => m.status === "SCHEDULED");

  const nextP1Name = getParticipantName(
    nextPendingMatch?.player1,
    nextPendingMatch?.team1,
  );

  const nextP2Name = getParticipantName(
    nextPendingMatch?.player2,
    nextPendingMatch?.team2,
  );

  return wrapInBaseLayout(
    <>
      <div className="no-print space-y-5">
        {/* ─── ADMIN HEADER MODULE ─── */}
      <header className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton to="/" label="Back to Home" className="mb-3" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF] text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4AEEFF] animate-pulse"></span>
            <span>Administration · Match Officiating Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">
            Referee Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-cyan-200/80 max-w-xl">
            Inspect your assigned fixtures, record official set scores, and track your officiating duty.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            onClick={() => setShowPaymentVoucherModal(true)}
            className="rounded-xl border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 hover:bg-[#4AEEFF] hover:text-[#061D23] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] transition-all flex items-center gap-2 shadow-sm active:scale-95"
            title="Official Referee Duty Log & Match Officiating Timesheet"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>My Duty Log</span>
          </button>
          <button
            onClick={fetchAssignedMatches}
            className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 p-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
            title="Refresh Assigned Matches"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── METRIC STATS CARDS (Admin Standard Grid) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Matches */}
        <div className="rounded-2xl border border-white/20 bg-[#061D23]/30 p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              Total Assigned
            </span>
            <div className="p-2 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF]">
              <TrophyIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {matches.length}
            </p>
            <p className="text-[11px] text-[#4AEEFF] font-medium mt-0.5">
              Official Fixtures
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl border border-amber-400/30 bg-[#061D23]/30 p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80">
              Pending / Live
            </span>
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <ClockIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">
              {pendingCount}
            </p>
            <p className="text-[11px] text-amber-300/70 font-medium mt-0.5">
              Awaiting Completion
            </p>
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-emerald-400/30 bg-[#061D23]/30 p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
              Completed
            </span>
            <div className="p-2 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
              {completedCount}
            </p>
            <p className="text-[11px] text-emerald-300/70 font-medium mt-0.5">
              Recorded & Verified
            </p>
          </div>
        </div>

        {/* Officiating Time */}
        <div className="rounded-2xl border border-[#4AEEFF]/40 bg-[#061D23]/30 p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF]">
              Officiating Time
            </span>
            <div className="p-2 rounded-xl bg-[#4AEEFF]/15 border border-[#4AEEFF]/40 text-[#4AEEFF]">
              <ChartBarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-[#4AEEFF] truncate">
              {refereeStats
                ? formatDuration(refereeStats.totalWorkingMinutes)
                : formatDuration(totalOfficiatingMinutes)}
            </p>
            <p className="text-[10px] text-white/60 font-medium mt-0.5 truncate">
              {refereeStats
                ? `Group: ${formatDuration(refereeStats.groupStageMinutes)} | KO: ${formatDuration(refereeStats.knockoutStageMinutes)}`
                : "Active Officiating Duration"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── NEXT MATCH ON COURT SPOTLIGHT HERO ─── */}
      {nextPendingMatch && (
        <section className="relative overflow-hidden rounded-[20px] border border-[#4AEEFF]/40 bg-gradient-to-r from-[#061D23]/95 via-[#0A2E36]/85 to-[#061D23]/95 p-6 shadow-[0_20px_50px_-10px_rgba(74,238,255,0.2)] backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4AEEFF] to-transparent shadow-[0_0_10px_#4AEEFF]" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4AEEFF] text-[#061D23] font-black text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(74,238,255,0.5)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#061D23] animate-ping"></span>
                  Next To Officiate
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  Match #{nextPendingMatch.matchNumber} •{" "}
                  {nextPendingMatch.round}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] text-[10px] font-black uppercase tracking-wider border border-[#4AEEFF]/30">
                  {nextPendingMatch.tournament?.name}
                </span>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#4AEEFF]/20 border border-[#4AEEFF]/40 flex items-center justify-center font-black text-xs text-[#4AEEFF]">
                    {getInitials(nextP1Name)}
                  </div>
                  <span className="text-lg sm:text-xl font-black text-white">
                    {nextP1Name}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-black text-[#4AEEFF]">
                  VS
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-xs text-white">
                    {getInitials(nextP2Name)}
                  </div>
                  <span className="text-lg sm:text-xl font-black text-white">
                    {nextP2Name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 font-mono flex-wrap">
                <span>
                  📍 {nextPendingMatch.tournament?.venue || "Tournament Venue"}
                </span>
                {nextPendingMatch.category && (
                  <>
                    <span>•</span>
                    <span>
                      {nextPendingMatch.category.name} (
                      {nextPendingMatch.category.type})
                    </span>
                  </>
                )}
                {nextPendingMatch.scheduledTime && (
                  <>
                    <span>•</span>
                    <span>
                      🕐 Scheduled:{" "}
                      {new Date(
                        nextPendingMatch.scheduledTime,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => setSelectedMatch(nextPendingMatch)}
                className="w-full sm:w-auto rounded-xl bg-[#4AEEFF] hover:bg-white text-[#061D23] px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#4AEEFF]/30 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>▶</span>
                <span>Open Scorecard & Record</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── FILTER & SEARCH CONTROLS ─── */}
      <section className="rounded-2xl border border-white/20 bg-[#061D23]/30 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Stage selection */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMatchType("knockout")}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                matchType === "knockout"
                  ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              Knockout Stage
            </button>
            <button
              onClick={() => setMatchType("group")}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                matchType === "group"
                  ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              Group Stage
            </button>
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "pending", "completed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  filter === st
                    ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)]"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* View toggle (Cards vs Table) */}
          <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "cards"
                  ? "bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
              title="Card View"
            >
              <Squares2X2Icon className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
              title="Table View"
            >
              <ListBulletIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Search & Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10">
          {/* Search bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search player, round, or match #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tournament Dropdown */}
          <GlassSelect
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full text-xs"
          >
            <option value="ALL" className="bg-[#061D23] text-white">
              All Tournaments ({uniqueTournaments.length})
            </option>
            {uniqueTournaments.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#061D23] text-white">
                {t.name}
              </option>
            ))}
          </GlassSelect>

          {/* Category Dropdown */}
          <GlassSelect
            value={selectedCategoryName}
            onChange={(e) => setSelectedCategoryName(e.target.value)}
            className="w-full text-xs"
          >
            <option value="ALL" className="bg-[#061D23] text-white">
              All Categories ({uniqueCategories.length})
            </option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c} className="bg-[#061D23] text-white">
                {c}
              </option>
            ))}
          </GlassSelect>
        </div>
      </section>

      {/* ─── MATCHES LIST OR TABLE ─── */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <section className="rounded-[20px] border border-white/15 bg-[#061D23]/30 p-6 sm:p-8 lg:p-10 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
              🏓
            </div>
            <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
              ● Official Standby
            </span>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
              No Matches Found
            </h3>
            <p className="mt-2 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              {matches.length === 0
                ? "You do not have any matches assigned to your referee account yet. Once the tournament administrator assigns you a fixture, it will appear here instantly."
                : `No fixtures match your current filter settings for ${matchType === "knockout" ? "Knockout" : "Group"} stage.`}
            </p>

            {matches.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {(filter !== "all" || searchTerm || selectedTournamentId !== "ALL" || selectedCategoryName !== "ALL") && (
                  <button
                    onClick={() => {
                      setFilter("all");
                      setSearchTerm("");
                      setSelectedTournamentId("ALL");
                      setSelectedCategoryName("ALL");
                    }}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all"
                  >
                    Reset All Filters
                  </button>
                )}
                <button
                  onClick={() =>
                    setMatchType(
                      matchType === "knockout" ? "group" : "knockout",
                    )
                  }
                  className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/15 px-4 py-2 text-xs font-bold text-[#4AEEFF] hover:bg-[#4AEEFF] hover:text-[#061D23] transition-all"
                >
                  Switch to{" "}
                  {matchType === "knockout" ? "Group Stage" : "Knockout Stage"}
                </button>
              </div>
            )}
          </section>
        ) : viewMode === "table" ? (
          /* ─── DESKTOP TABLE VIEW ─── */
          <div className="rounded-2xl border border-white/20 bg-[#061D23]/30 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl overflow-hidden text-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/15 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF]">
                    <th className="px-5 py-3.5 text-center w-24">Match #</th>
                    <th className="px-5 py-3.5">Tournament & Category</th>
                    <th className="px-5 py-3.5">Competitors</th>
                    <th className="px-5 py-3.5 text-center">Score / Sets</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm">
                  {filteredMatches.map((match) => {
                    const p1Name = getParticipantName(match.player1, match.team1);
                    const p2Name = getParticipantName(match.player2, match.team2);
                    const isP1Winner =
                      match.status === "COMPLETED" &&
                      (match.winnerId === match.player1?.id ||
                        match.winnerId === match.team1?.id);
                    const isP2Winner =
                      match.status === "COMPLETED" &&
                      (match.winnerId === match.player2?.id ||
                        match.winnerId === match.team2?.id);
                    const scoreParts = match.score
                      ? match.score.split(",").map((s) => s.trim())
                      : [];

                    return (
                      <tr
                        key={match.id}
                        className="group transition-colors hover:bg-white/5"
                      >
                        {/* Match Number & Round */}
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex flex-col items-center">
                            <span className="text-[#4AEEFF] font-mono font-bold text-xs">
                              #{match.matchNumber}
                            </span>
                            <span className="text-[10px] text-white/50 font-mono">
                              {match.round}
                            </span>
                          </span>
                        </td>

                        {/* Tournament & Category */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-white text-xs truncate max-w-[200px]">
                            {match.tournament?.name}
                          </p>
                          <p className="text-[11px] text-white/60 truncate mt-0.5">
                            {match.category?.name} ({match.category?.type})
                          </p>
                        </td>

                        {/* Competitors */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-xs truncate max-w-[130px] ${
                                isP1Winner ? "text-emerald-300 font-black" : "text-white"
                              }`}
                            >
                              {p1Name}
                            </span>
                            {isP1Winner && <span className="text-xs">👑</span>}
                            <span className="text-[10px] text-[#4AEEFF] font-black px-1.5 py-0.5 rounded bg-white/10">
                              VS
                            </span>
                            <span
                              className={`font-bold text-xs truncate max-w-[130px] ${
                                isP2Winner ? "text-emerald-300 font-black" : "text-white"
                              }`}
                            >
                              {p2Name}
                            </span>
                            {isP2Winner && <span className="text-xs">👑</span>}
                          </div>
                        </td>

                        {/* Score / Sets */}
                        <td className="px-5 py-4 text-center">
                          {scoreParts.length > 0 ? (
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {scoreParts.map((setStr, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-black/40 border border-[#4AEEFF]/30 text-xs font-mono font-bold text-[#4AEEFF]"
                                >
                                  {setStr}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-white/40 font-mono">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider inline-block ${getStatusBadgeClass(
                              match.status,
                            )}`}
                          >
                            {match.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedMatch(match)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm ${
                              match.status === "COMPLETED"
                                ? "border border-white/20 bg-white/5 hover:bg-white/10 text-white"
                                : "bg-[#4AEEFF] hover:bg-white text-[#061D23] font-black shadow-md shadow-[#4AEEFF]/20"
                            }`}
                          >
                            {match.status === "COMPLETED" ? "View Score" : "Manage Score →"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ─── CARD VIEW ─── */
          filteredMatches.map((match) => {
            const p1Name = getParticipantName(match.player1, match.team1);
            const p2Name = getParticipantName(match.player2, match.team2);

            const isP1Winner =
              match.status === "COMPLETED" &&
              (match.winnerId === match.player1?.id ||
                match.winnerId === match.team1?.id);
            const isP2Winner =
              match.status === "COMPLETED" &&
              (match.winnerId === match.player2?.id ||
                match.winnerId === match.team2?.id);

            const scoreParts = match.score
              ? match.score.split(",").map((s) => s.trim())
              : [];

            return (
              <section
                key={match.id}
                className="group rounded-[18px] border border-white/15 bg-[#061D23]/30 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all hover:border-[#4AEEFF]/40 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(
                        match.status,
                      )}`}
                    >
                      {match.status}
                    </span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      {match.tournament?.name}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {match.category?.name} ({match.category?.type})
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-[#4AEEFF] font-mono font-bold">
                      {match.round} • Match #{match.matchNumber}
                    </span>
                  </div>

                  {/* Competitor Matchup */}
                  <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                          isP1Winner
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : "bg-white/5 border-white/15 text-slate-300"
                        }`}
                      >
                        {getInitials(p1Name)}
                      </div>
                      <span
                        className={`text-base sm:text-lg font-black ${
                          isP1Winner ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {p1Name}
                      </span>
                      {isP1Winner && <span className="text-xs">👑</span>}
                    </div>

                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black text-slate-400">
                      VS
                    </span>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                          isP2Winner
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : "bg-white/5 border-white/15 text-slate-300"
                        }`}
                      >
                        {getInitials(p2Name)}
                      </div>
                      <span
                        className={`text-base sm:text-lg font-black ${
                          isP2Winner ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {p2Name}
                      </span>
                      {isP2Winner && <span className="text-xs">👑</span>}
                    </div>
                  </div>

                  {/* Set-by-Set Score Pill Display */}
                  {scoreParts.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 font-mono">
                        Sets:
                      </span>
                      {scoreParts.map((setStr, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-black/40 border border-[#4AEEFF]/30 text-xs font-mono font-bold text-[#4AEEFF]"
                        >
                          {setStr}
                        </span>
                      ))}
                    </div>
                  )}

                  {match.status === "COMPLETED" &&
                    (() => {
                      const duration = getMatchDurationMinutes(match);

                      return (
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          <span className="text-[#4AEEFF] font-bold">
                            ⏱ Officiating Duration:
                          </span>

                          <span className="rounded-md border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-2.5 py-1 text-[#4AEEFF] font-bold">
                            {duration !== null
                              ? formatDuration(duration)
                              : "Not recorded"}
                          </span>
                        </div>
                      );
                    })()}

                  {match.scheduledTime && (
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>📍 {match.tournament?.venue || "Main Court"}</span>
                      <span>•</span>
                      <span>
                        🕐{" "}
                        {new Date(match.scheduledTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setSelectedMatch(match)}
                    className={`w-full md:w-auto rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm ${
                      match.status === "COMPLETED"
                        ? "border border-white/20 bg-white/5 hover:bg-white/10 text-white"
                        : "bg-[#4AEEFF] hover:bg-white text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                    }`}
                  >
                    {match.status === "COMPLETED"
                      ? "View Score"
                      : "Manage Score →"}
                  </button>
                </div>
              </section>
            );
          })
        )}
      </div>
      </div>{/* ─── OFFICIAL REFEREE OFFICIATING DUTY LOG MODAL (PRINT-OPTIMIZED) ─── */}
      {showPaymentVoucherModal && (
        <div className="printable-document-wrapper fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex justify-center items-start pt-16 sm:pt-20 pb-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 print:bg-white print:p-0 print:m-0 print:static print:w-full print:max-w-full">
          <div className="printable-document-card bg-[#061D23]/95 border border-[#4AEEFF]/40 rounded-2xl max-w-3xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 my-auto custom-scrollbar print:bg-white print:text-slate-900 print:border-slate-800 print:shadow-none print:p-4 print:space-y-3 print:max-w-full print:w-full">
            {/* Log Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/15 print:border-slate-300">
              <div className="flex items-center gap-3">
                <img
                  src={invertedLogo}
                  alt="Sam's College"
                  className="h-10 w-auto object-contain block shrink-0 print:hidden"
                />
                <img
                  src={darkLogo}
                  alt="Sam's College"
                  className="h-10 w-auto object-contain hidden print:block shrink-0"
                />
                <div className="h-7 w-[1px] bg-white/20 print:bg-slate-300" />
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white print:text-slate-900">
                    Official Referee Officiating Log
                  </h3>
                  <p className="text-[11px] text-[#4AEEFF] print:text-sky-800 font-medium font-mono">
                    Tournament Officiating Timesheet & Verified Match Record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentVoucherModal(false)}
                className="no-print print:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition self-end sm:self-auto"
              >
                ✕
              </button>
            </div>

            {/* Referee & Officiating Meta Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs print:bg-slate-50 print:border-slate-300">
              <div>
                <p className="text-white/50 print:text-slate-600 text-[10px] font-bold uppercase tracking-wider">Officiating Referee</p>
                <p className="text-white print:text-slate-900 font-bold mt-0.5 text-xs truncate">
                  {user ? `${user.firstName} ${user.lastName || ""}` : "Official Referee"}
                </p>
                <p className="text-white/40 print:text-slate-500 text-[10px] truncate">{user?.email || "Certified Official"}</p>
              </div>
              <div>
                <p className="text-white/50 print:text-slate-600 text-[10px] font-bold uppercase tracking-wider">Date of Log</p>
                <p className="text-white print:text-slate-900 font-mono font-bold mt-0.5">{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
                <p className="text-white/40 print:text-slate-500 text-[10px]">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div>
                <p className="text-white/50 print:text-slate-600 text-[10px] font-bold uppercase tracking-wider">Duty Status</p>
                <p className="text-emerald-400 print:text-emerald-700 font-bold mt-0.5 font-mono">● Certified Active Duty</p>
                <p className="text-white/40 print:text-slate-500 text-[10px]">Official Record Verified</p>
              </div>
              <div>
                <p className="text-white/50 print:text-slate-600 text-[10px] font-bold uppercase tracking-wider">Officiating Time</p>
                <p className="text-[#4AEEFF] print:text-sky-800 font-mono font-black mt-0.5">
                  {refereeStats
                    ? formatDuration(refereeStats.totalWorkingMinutes)
                    : formatDuration(totalOfficiatingMinutes)}
                </p>
                <p className="text-white/40 print:text-slate-500 text-[10px]">Total Active Officiating</p>
              </div>
            </div>

            {/* Officiating Activity Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs print:bg-slate-50 print:border-slate-300">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 print:text-slate-600 block">Total Assigned</span>
                <span className="text-sm sm:text-base font-black text-white print:text-slate-900 mt-0.5 block">{matches.length} Fixtures</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 print:text-amber-700 block">Pending / Live</span>
                <span className="text-sm sm:text-base font-black text-amber-400 print:text-amber-800 mt-0.5 block">{pendingCount} Fixtures</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 print:text-emerald-700 block">Completed</span>
                <span className="text-sm sm:text-base font-black text-emerald-400 print:text-emerald-800 mt-0.5 block">{completedCount} Verified</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4AEEFF] print:text-sky-800 block">Stage Split</span>
                <span className="text-[11px] font-mono text-cyan-200 print:text-slate-700 mt-1 block">
                  KO: {matches.filter((m) => !m.isGroupMatch).length} | Grp: {matches.filter((m) => m.isGroupMatch).length}
                </span>
              </div>
            </div>

            {/* Completed Matches Itemized Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-white print:text-slate-900">
                  Itemized Completed Matches ({matches.filter((m) => m.status === "COMPLETED").length})
                </h4>
                <span className="text-[10px] text-white/50 print:text-slate-500 font-mono">
                  All Scores Official & ITTF Verified
                </span>
              </div>
              <div className="rounded-xl border border-white/10 print:border-slate-300 overflow-hidden">
                <div className="max-h-56 overflow-y-auto printable-table-scroll">
                  <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60 font-mono print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                        <th className="px-3 py-2 text-center w-10">#</th>
                        <th className="px-3 py-2">Tournament & Round</th>
                        <th className="px-3 py-2">Competitors</th>
                        <th className="px-3 py-2 text-center">Score</th>
                        <th className="px-3 py-2 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px] print:divide-slate-200 print:text-[10px]">
                      {matches.filter((m) => m.status === "COMPLETED").length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3.5 py-6 text-center text-white/40 print:text-slate-500 italic">
                            No completed matches recorded for this duty period yet.
                          </td>
                        </tr>
                      ) : (
                        matches
                          .filter((m) => m.status === "COMPLETED")
                          .map((m, idx) => {
                            const p1 = getParticipantName(m.player1, m.team1);
                            const p2 = getParticipantName(m.player2, m.team2);
                            const dur = getMatchDurationMinutes(m);

                            return (
                              <tr key={m.id} className="hover:bg-white/5 print:hover:bg-transparent">
                                <td className="px-3 py-2 text-[#4AEEFF] print:text-slate-900 font-bold text-center">#{idx + 1}</td>
                                <td className="px-3 py-2">
                                  <span className="text-white print:text-slate-900 font-sans font-bold block">{m.tournament?.name}</span>
                                  <span className="text-white/50 print:text-slate-600 text-[10px]">{m.round} · Match #{m.matchNumber}</span>
                                </td>
                                <td className="px-3 py-2 text-white/90 print:text-slate-900 font-sans font-semibold">
                                  {p1} <span className="text-[#4AEEFF] print:text-sky-700 font-bold">vs</span> {p2}
                                </td>
                                <td className="px-3 py-2 text-center text-[#4AEEFF] print:text-slate-900 font-bold font-mono">{m.score || "—"}</td>
                                <td className="px-3 py-2 text-right text-white/70 print:text-slate-700 font-mono">
                                  {dur !== null ? `${dur} min` : "—"}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Official Signatures Verification Block */}
            <div className="grid grid-cols-2 gap-8 pt-3 border-t border-white/10 print:border-slate-300 text-xs">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 print:text-slate-600">Officiating Referee</p>
                <div className="border-b border-white/30 print:border-slate-400 pb-1">
                  <span className="text-white/30 print:text-slate-800 italic text-[11px] font-semibold">
                    {user ? `${user.firstName} ${user.lastName || ""}` : "Referee Digital Signature"}
                  </span>
                </div>
                <p className="text-[10px] text-white/60 print:text-slate-600">Signed & Submitted by Officiating Referee</p>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 print:text-slate-600">Tournament Director / Head Official</p>
                <div className="border-b border-white/30 print:border-slate-400 pb-1">
                  <span className="text-white/30 print:text-slate-800 italic text-[11px] font-semibold">[ Verified Official Match Record ]</span>
                </div>
                <p className="text-[10px] text-white/60 print:text-slate-600">Authorized Signature & Club Seal</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-3 no-print print:hidden">
              <span className="text-[10px] text-white/40 italic">
                Official Sam&apos;s College Table Tennis Management System
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePrintDutyLog}
                  className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
                >
                  <PrinterIcon className="w-4 h-4 text-[#4AEEFF]" />
                  <span>Print / Export PDF</span>
                </button>
                <button
                  onClick={() => setShowPaymentVoucherModal(false)}
                  className="rounded-xl bg-[#4AEEFF] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-md active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMatch &&
        (selectedMatch.isGroupMatch ? (
          <UmpireSheet
            match={selectedMatch as unknown as GroupMatch}
            onClose={() => setSelectedMatch(null)}
            onSave={handleGroupMatchSave}
            isAdminOrReferee={true}
            categoryName={selectedMatch.category?.name}
          />
        ) : (
          <KnockoutUmpireSheet
            match={selectedMatch as any}
            onClose={() => setSelectedMatch(null)}
            onSave={handleKnockoutMatchSave}
            isAdminOrReferee={selectedMatch.status !== "COMPLETED"}
          />
        ))}
    </>
  );
};

export default RefereeMatches;
