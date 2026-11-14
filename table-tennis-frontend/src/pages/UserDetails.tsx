import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  DocumentTextIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api, { getProfileImageUrl } from "../services/api";
import invertedLogo from "../assets/Logo  with Name inverted.png";
import darkLogo from "../assets/Logo  with Name.png";

interface AssignedMatch {
  id: string;
  round?: string;
  matchNumber?: number;
  status: string;
  score?: string | null;
  scheduledTime: string;
  tournament?: { id: string; name: string };
  category?: { id: string; name: string };
  group?: {
    tournament: { id: string; name: string };
    category: { id: string; name: string };
  };
}

interface UserDetailsData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  profileImage: string | null;
  createdAt: string;
  permissions: string[];
  refereeProfile?: {
    certification: string | null;
    experienceYears: number | null;
    matches: AssignedMatch[];
    groupMatches: AssignedMatch[];
  } | null;
  adminProfile?: { department: string | null } | null;
}

const UserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentVoucher, setShowPaymentVoucher] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const response = await api.get(`/users/${userId}`);
        const data = response.data.data as UserDetailsData;
        if (data.role !== "ADMIN" && data.role !== "SUPER_ADMIN" && data.role !== "REFEREE") {
          toast.error("Only Admin and Referee profiles are available here.");
          navigate("/app/users", { replace: true });
          return;
        }
        setProfile(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load user profile");
        navigate("/app/users", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, userId]);

  const wrapInProfileLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white print:bg-white print:min-h-0 print:p-0 print:m-0 print:overflow-visible">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat no-print print:hidden"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25 no-print print:hidden" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 no-print print:hidden" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8 print:min-h-0 print:max-w-full print:p-0 print:m-0 print:space-y-0">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return wrapInProfileLayout(
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading profile...
        </div>
      </div>,
    );
  }

  if (!profile) return null;

  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const imageUrl = getProfileImageUrl(profile.profileImage);
  const assignedMatches = [
    ...(profile.refereeProfile?.matches || []),
    ...(profile.refereeProfile?.groupMatches || []),
  ];

  const handlePrintDutyLogAdmin = () => {
    if (!profile) return;
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

    const completedMatches = assignedMatches.filter((m) => m.status === "COMPLETED");
    const pendingCount = assignedMatches.filter((m) => m.status === "SCHEDULED" || m.status === "ONGOING").length;
    const refereeName = `${profile.firstName} ${profile.lastName || ""}`.trim();
    const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: "long" });
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const rowsHtml = completedMatches.length === 0
      ? `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">No completed matches recorded for this referee yet.</td></tr>`
      : completedMatches.map((m, idx) => {
          const tourneyName = m.tournament?.name || m.group?.tournament?.name || "Tournament";
          const catRound = `${m.category?.name || m.group?.category?.name || "Category"} · ${m.round || "Fixture"}`;
          return `
            <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
              <td style="padding: 5px 8px; font-weight: bold; color: #0284c7; text-align: center;">#${idx + 1}</td>
              <td style="padding: 5px 8px; font-weight: 700; color: #0f172a; font-size: 10.5px;">${tourneyName}</td>
              <td style="padding: 5px 8px; color: #475569; font-size: 10px;">${catRound}</td>
              <td style="padding: 5px 8px; text-align: right; color: #047857; font-weight: 800; font-family: monospace; font-size: 10px;">VERIFIED</td>
            </tr>
          `;
        }).join("");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <base href="${window.location.origin}/" />
          <title>Official Referee Officiating Log - ${refereeName}</title>
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
              grid-template-columns: repeat(3, 1fr);
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
                  <p>Admin Match Officiating Review & Activity Log</p>
                </div>
              </div>
              <div style="text-align: right; font-size: 8.5px; color: #64748b; font-family: monospace;">
                <div>ADMIN VERIFIED</div>
                <div style="font-weight: bold; color: #0284c7;">ITTF OFFICIAL RECORD</div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <div class="meta-label">Referee Name</div>
                <div class="meta-value">${refereeName}</div>
                <div class="meta-sub">${profile.email}</div>
              </div>
              <div>
                <div class="meta-label">Certification / Role</div>
                <div class="meta-value" style="color: #0284c7;">${profile.refereeProfile?.certification || "Official Club Referee"}</div>
                <div class="meta-sub">${profile.refereeProfile?.experienceYears ? `${profile.refereeProfile.experienceYears} Years Exp` : "Active Official"}</div>
              </div>
              <div>
                <div class="meta-label">Date of Log</div>
                <div class="meta-value">${dateStr}</div>
                <div class="meta-sub">${timeStr}</div>
              </div>
            </div>

            <div class="summary-strip">
              <div>
                <div class="meta-label">Total Assigned</div>
                <div class="summary-val">${assignedMatches.length} Fixtures</div>
              </div>
              <div>
                <div class="meta-label">Pending / Live</div>
                <div class="summary-val" style="color: #b45309;">${pendingCount} Fixtures</div>
              </div>
              <div>
                <div class="meta-label">Completed</div>
                <div class="summary-val" style="color: #047857;">${completedMatches.length} Verified</div>
              </div>
              <div>
                <div class="meta-label">Duty Status</div>
                <div class="summary-val" style="color: #047857; font-size: 11px;">● Active Certified</div>
              </div>
            </div>

            <div class="section-title">
              <span>Verified Officiated Matches (${completedMatches.length})</span>
              <span style="font-size: 8.5px; font-weight: normal; color: #64748b; font-family: monospace;">All Records Certified</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30px; text-align: center;">#</th>
                  <th style="text-align: left;">Tournament</th>
                  <th style="text-align: left;">Category / Round</th>
                  <th style="text-align: right; width: 85px;">Status</th>
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
                <div class="sig-title">Authorized Tournament Director</div>
                <div class="sig-line">[ Club Seal & Authorized Signature ]</div>
                <div class="sig-desc">Authorized Signature & Club Seal</div>
              </div>
            </div>

            <div class="footer-note">
              Official Sam's College Table Tennis Management System · Certified Match Officiating Review
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
  const permissionLabel = (permission: string) =>
    permission
      .replace(/^MANAGE_/, "")
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return wrapInProfileLayout(
    <>
      <div className="no-print space-y-6">
        <BackButton to="/app/users" label="Back to Users" className="mb-4 self-start" />

        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {imageUrl ? (
              <img src={imageUrl} alt={`${name} profile`} className="h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-lg sm:h-24 sm:w-24" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#12679E]/40 to-white/5 text-4xl font-black text-white shadow-lg sm:h-24 sm:w-24">
                <UserIcon className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
            )}
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{name}</h1>
                <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {profile.role === "REFEREE" ? "Referee" : "Admin"}
                </span>
              </div>
              <div className="space-y-1 text-xs text-white/60">
                <p className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4 text-[#4AEEFF]" />{profile.email}</p>
                <p className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-[#4AEEFF]" />{profile.phone || "Phone not provided"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-white">Profile Details</h2>
          <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
            <p><span className="text-white/40">Joined:</span> {new Date(profile.createdAt).toLocaleDateString()}</p>
            {profile.adminProfile?.department && <p><span className="text-white/40">Department:</span> {profile.adminProfile.department}</p>}
            {profile.refereeProfile?.certification && <p><span className="text-white/40">Certification:</span> {profile.refereeProfile.certification}</p>}
            {profile.refereeProfile?.experienceYears !== null && profile.refereeProfile?.experienceYears !== undefined && (
              <p><span className="text-white/40">Experience:</span> {profile.refereeProfile.experienceYears} years</p>
            )}
          </div>
        </section>

        {(profile.role === "ADMIN" || profile.role === "SUPER_ADMIN") && (
          <section className="rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-white">
              Permissions
            </h2>
            {profile.permissions.length === 0 ? (
              <p className="text-sm text-white/50">No permissions assigned yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="rounded-xl border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 px-4 py-3 text-sm font-bold text-[#B8F7FF]"
                  >
                    {permissionLabel(permission)}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {profile.role === "REFEREE" && (
        <>
          <div className="no-print space-y-6">
            {/* Referee Duty & Compensation Summary */}
            <section className="rounded-2xl border border-[#4AEEFF]/30 bg-gradient-to-r from-[#061D23]/80 via-[#0A2E36]/70 to-[#061D23]/80 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                  Officiating Duty Overview
                </span>
                <h2 className="text-xl font-heading font-black uppercase tracking-wider text-white mt-1">
                  Referee Officiating & Match Summary
                </h2>
              </div>
              <button
                onClick={() => setShowPaymentVoucher(true)}
                className="rounded-xl bg-[#4AEEFF] hover:bg-white text-[#061D23] px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-[#4AEEFF]/20 active:scale-95 flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>View Officiating Log</span>
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Total Assigned</span>
                <p className="text-xl font-black text-white mt-0.5">{assignedMatches.length}</p>
                <span className="text-[10px] text-white/40">Official Fixtures</span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-400/5 border border-amber-400/20">
                <span className="text-amber-300/80 text-[10px] font-bold uppercase tracking-wider">Pending / Live</span>
                <p className="text-xl font-black text-amber-400 mt-0.5">
                  {assignedMatches.filter((m) => m.status === "SCHEDULED" || m.status === "ONGOING").length}
                </p>
                <span className="text-[10px] text-amber-300/50">Awaiting Score</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
                <span className="text-emerald-300/80 text-[10px] font-bold uppercase tracking-wider">Completed</span>
                <p className="text-xl font-black text-emerald-400 mt-0.5">
                  {assignedMatches.filter((m) => m.status === "COMPLETED").length}
                </p>
                <span className="text-[10px] text-emerald-300/50">Verified Matches</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30">
                <span className="text-[#4AEEFF] text-[10px] font-bold uppercase tracking-wider">Duty Status</span>
                <p className="text-xl font-black text-[#4AEEFF] mt-0.5">● Certified</p>
                <span className="text-[10px] text-[#4AEEFF]/70">Official Club Referee</span>
              </div>
            </div>
          </section>

          {/* Assigned Matches List */}
          <section className="rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-white">Assigned Matches</h2>
            {assignedMatches.length === 0 ? (
              <p className="text-sm text-white/50">No matches assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {assignedMatches.map((match) => {
                  const tournament = match.tournament || match.group?.tournament;
                  const category = match.category || match.group?.category;
                  return (
                    <div key={match.id} className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.05] sm:flex-row sm:items-center">
                      <div>
                        <p className="font-bold text-white">{tournament?.name || "Tournament"}</p>
                        <p className="text-xs text-white/50">{category?.name || "Category"} {match.round ? `• ${match.round}` : ""}</p>
                      </div>
                      <div className="text-left text-xs text-white/60 sm:text-right">
                        <p className="font-bold text-[#4AEEFF]">{match.status}</p>
                        <p>{new Date(match.scheduledTime).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Admin Officiating Log Modal (PRINT-OPTIMIZED) */}
        {showPaymentVoucher && (
          <div className="printable-document-wrapper fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex justify-center items-start pt-16 sm:pt-20 pb-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 print:bg-white print:p-0 print:m-0 print:static print:w-full print:max-w-full">
            <div className="printable-document-card bg-[#061D23]/95 border border-[#4AEEFF]/40 rounded-2xl max-w-3xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 my-auto custom-scrollbar print:bg-white print:text-slate-900 print:border-slate-800 print:shadow-none print:p-4 print:space-y-3 print:max-w-full print:w-full">
              {/* Header */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/15 print:border-slate-300">
                <div className="flex items-center gap-3">
                  <img src={invertedLogo} alt="Sam's College" className="h-10 w-auto object-contain block shrink-0 print:hidden" />
                  <img src={darkLogo} alt="Sam's College" className="h-10 w-auto object-contain hidden print:block shrink-0" />
                  <div className="h-7 w-[1px] bg-white/20 print:bg-slate-300" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white print:text-slate-900">
                      Official Referee Officiating Log
                    </h3>
                    <p className="text-[11px] text-[#4AEEFF] print:text-sky-800 font-medium font-mono">
                      Admin Match Officiating Review & Activity Log
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentVoucher(false)}
                  className="no-print print:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              {/* Referee Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs print:bg-slate-50 print:border-slate-300">
                <div>
                  <p className="text-white/50 print:text-slate-600 text-[10px] font-bold uppercase tracking-wider">Referee Name</p>
                  <p className="text-white print:text-slate-900 font-bold mt-0.5">{profile.firstName} {profile.lastName}</p>
                  <p className="text-white/40 print:text-slate-500 text-[10px]">{profile.email}</p>
                </div>
                <div>
                  <p className="text-white/50 print:text-slate-600 text-[10px] font-bold uppercase tracking-wider">Certification / Role</p>
                  <p className="text-[#4AEEFF] print:text-sky-800 font-bold mt-0.5">
                    {profile.refereeProfile?.certification || "Official Club Referee"}
                  </p>
                  <p className="text-white/40 print:text-slate-500 text-[10px]">{profile.refereeProfile?.experienceYears ? `${profile.refereeProfile.experienceYears} Years Experience` : "Active Official"}</p>
                </div>
                <div>
                  <p className="text-white/50 print:text-slate-600 text-[10px] font-bold uppercase tracking-wider">Date of Log</p>
                  <p className="text-white print:text-slate-900 font-mono font-bold mt-0.5">{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
                </div>
              </div>

              {/* Activity Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs print:bg-slate-50 print:border-slate-300">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 print:text-slate-600 block">Total Assigned</span>
                  <span className="text-sm sm:text-base font-black text-white print:text-slate-900 mt-0.5 block">{assignedMatches.length} Fixtures</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 print:text-amber-700 block">Pending / Live</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 print:text-amber-800 mt-0.5 block">
                    {assignedMatches.filter((m) => m.status === "SCHEDULED" || m.status === "ONGOING").length} Fixtures
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 print:text-emerald-700 block">Completed</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400 print:text-emerald-800 mt-0.5 block">
                    {assignedMatches.filter((m) => m.status === "COMPLETED").length} Verified
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4AEEFF] print:text-sky-800 block">Duty Status</span>
                  <span className="text-sm sm:text-base font-black text-[#4AEEFF] print:text-emerald-700 mt-0.5 block">● Active</span>
                </div>
              </div>

              {/* Table of Completed Matches */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white print:text-slate-900 mb-2">
                  Verified Officiated Matches ({assignedMatches.filter((m) => m.status === "COMPLETED").length})
                </h4>
                <div className="rounded-xl border border-white/10 print:border-slate-300 overflow-hidden max-h-52 overflow-y-auto printable-table-scroll">
                  <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60 font-mono print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                        <th className="px-3 py-2 text-center w-10">#</th>
                        <th className="px-3 py-2">Tournament</th>
                        <th className="px-3 py-2">Category / Round</th>
                        <th className="px-3 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px] print:divide-slate-200 print:text-[10px]">
                      {assignedMatches.filter((m) => m.status === "COMPLETED").length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3.5 py-4 text-center text-white/40 print:text-slate-500 italic">
                            No completed matches for this referee yet.
                          </td>
                        </tr>
                      ) : (
                        assignedMatches
                          .filter((m) => m.status === "COMPLETED")
                          .map((m, idx) => (
                            <tr key={m.id} className="hover:bg-white/5 print:hover:bg-transparent">
                              <td className="px-3 py-2 text-[#4AEEFF] print:text-slate-900 font-bold text-center">#{idx + 1}</td>
                              <td className="px-3 py-2 text-white print:text-slate-900 font-sans font-bold">{m.tournament?.name || m.group?.tournament?.name || "Tournament"}</td>
                              <td className="px-3 py-2 text-white/70 print:text-slate-700">{m.category?.name || m.group?.category?.name || "Category"} · {m.round || "Fixture"}</td>
                              <td className="px-3 py-2 text-right text-emerald-400 print:text-emerald-800 font-bold font-mono">VERIFIED</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-3 border-t border-white/10 print:border-slate-300 text-xs">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 print:text-slate-600">Officiating Referee</p>
                  <div className="border-b border-white/30 print:border-slate-400 pb-1">
                    <span className="text-white/30 print:text-slate-800 italic text-[11px] font-semibold">{profile.firstName} {profile.lastName}</span>
                  </div>
                  <p className="text-[10px] text-white/60 print:text-slate-600">Signed & Submitted by Officiating Referee</p>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 print:text-slate-600">Authorized Tournament Director</p>
                  <div className="border-b border-white/30 print:border-slate-400 pb-1">
                    <span className="text-white/30 print:text-slate-800 italic text-[11px] font-semibold">[ Club Seal & Authorized Signature ]</span>
                  </div>
                  <p className="text-[10px] text-white/60 print:text-slate-600">Authorized Signature & Club Seal</p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-3 no-print print:hidden">
                <span className="text-[10px] text-white/40 italic">
                  Official Sam&apos;s College Table Tennis Management System
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handlePrintDutyLogAdmin}
                    className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    <PrinterIcon className="w-4 h-4 text-[#4AEEFF]" />
                    <span>Print / Export PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPaymentVoucher(false)}
                    className="rounded-xl bg-[#4AEEFF] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-md active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </>,
  );
};

export default UserDetails;
