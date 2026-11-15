import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import invertedLogo from "../assets/Logo  with Name inverted.png";
import darkLogo from "../assets/Logo  with Name.png";
import {
  ShieldCheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrophyIcon,
  BanknotesIcon,
  UserGroupIcon,
  ClockIcon,
  InformationCircleIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface AuditEvent {
  id: string;
  category: "REFEREE" | "PAYMENT" | "MEMBERSHIP" | "USER" | "TOURNAMENT";
  action: string;
  badgeColor: "emerald" | "cyan" | "amber" | "rose";
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  target: string;
  details: string;
  timestamp: string;
  status: string;
}

interface AuditMetrics {
  totalLogs: number;
  refereeDutyCount: number;
  paymentsProcessed: number;
  membershipsProcessed: number;
  registeredAccounts: number;
}

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printFilterCategory, setPrintFilterCategory] = useState<string>("ALL");

  const fetchAuditLogs = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const res = await api.get("/audit-logs");
      if (res.data?.status === "success") {
        setEvents(res.data.data.events || []);
        setMetrics(res.data.data.metrics || null);
        if (showToast) {
          toast.success("Audit trail synchronized with live system records");
        }
      }
    } catch (err: any) {
      console.error("Failed to load audit logs", err);
      toast.error(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filtered events based on active category tab & search query on main page
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesCategory =
        activeCategory === "ALL" || ev.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ev.actorName.toLowerCase().includes(q) ||
        (ev.actorEmail && ev.actorEmail.toLowerCase().includes(q)) ||
        ev.target.toLowerCase().includes(q) ||
        ev.details.toLowerCase().includes(q) ||
        ev.action.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [events, activeCategory, searchQuery]);

  // Printable events based on print modal scope selector
  const printableEvents = useMemo(() => {
    if (printFilterCategory === "ALL") return events;
    return events.filter((ev) => ev.category === printFilterCategory);
  }, [events, printFilterCategory]);

  const getHumanReadableAction = (action: string) => {
    switch (action) {
      case "MATCH_OFFICIATED":
        return "Match Scorecard Officiated & Recorded";
      case "MATCH_IN_PROGRESS":
        return "Match In Progress / Set Underway";
      case "PAYMENT_VERIFIED":
        return "Tournament Registration Fee Verified";
      case "PAYMENT_REJECTED":
        return "Registration Payment Slip Rejected";
      case "PAYMENT_SUBMITTED":
        return "Payment Slip Submitted For Review";
      case "MEMBERSHIP_APPROVED":
        return "Club Membership Application Approved";
      case "MEMBERSHIP_REJECTED":
        return "Club Membership Application Rejected";
      case "MEMBERSHIP_REQUESTED":
        return "New Club Membership Request Submitted";
      case "CLUB_RANK_ASSIGNED":
        return "Official Club Seeding Rank Assigned";
      case "USER_REGISTERED":
        return "User Account Registered In System";
      case "TOURNAMENT_CONCLUDED":
        return "Tournament Concluded & Finalized";
      case "TOURNAMENT_UPDATED":
        return "Tournament Operational Status Updated";
      default:
        return action.replace(/_/g, " ");
    }
  };

  const getHumanReadableModule = (category: string) => {
    switch (category) {
      case "REFEREE":
        return "OFFICIATING & MATCHES";
      case "PAYMENT":
        return "FINANCE & REGISTRATIONS";
      case "MEMBERSHIP":
        return "CLUB MEMBERSHIPS";
      case "USER":
        return "USER GOVERNANCE & SEEDING";
      case "TOURNAMENT":
        return "TOURNAMENT OPERATIONS";
      default:
        return category;
    }
  };

  // Enterprise-Grade CSV Export using Blob & UTF-8 BOM (Always respects applied filters)
  const handleExportCSV = (
    customTargetEvents?: AuditEvent[],
    customScopeName?: string,
    fileSuffix?: string
  ) => {
    // Determine target events strictly from the active filter/search
    const targetEvents = customTargetEvents || filteredEvents;

    if (targetEvents.length === 0) {
      toast.error("No audit logs match your selected filter to export");
      return;
    }

    const currentSuperAdmin = user
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : "Super Admin";
    const currentEmail = user?.email || "admin@tabletennis.com";
    const exportTimestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "medium",
    });

    const scopeLabel =
      customScopeName ||
      (activeCategory === "ALL"
        ? searchQuery
          ? `All Modules (Filter: "${searchQuery}")`
          : "Full System Audit Trail (All Modules)"
        : `${getHumanReadableModule(activeCategory)}${searchQuery ? ` (Filter: "${searchQuery}")` : ""}`);

    const slug =
      fileSuffix ||
      (customTargetEvents ? "Custom_Scope" : activeCategory.toLowerCase());

    // Professional Institutional Metadata Header Banner
    const bannerLines = [
      `"===================================================================================================="`,
      `"SAM'S COLLEGE TABLE TENNIS MANAGEMENT SYSTEM - OFFICIAL AUDIT & SECURITY TRAIL"`,
      `"===================================================================================================="`,
      `"Report Title"          : "Official System Activity, Officiating & Financial Verification Log"`,
      `"Institution"           : "Sam's College Table Tennis Club & Academy"`,
      `"Generated By"          : "${currentSuperAdmin} (${user?.role || "SUPER_ADMIN"} - ${currentEmail})"`,
      `"Generated At"          : "${exportTimestamp}"`,
      `"Classification"        : "CONFIDENTIAL - AUTHORIZED AUDIT & GOVERNANCE RECORD"`,
      `"Total Records Exported": "${targetEvents.length} Filtered Events"`,
      `"Export Scope"          : "${scopeLabel}"`,
      `"System Integrity"      : "Verified Tamper-Evident Database Log"`,
      `"===================================================================================================="`,
      `""`,
    ];

    const columnHeaders = [
      "Event Index",
      "Timestamp (UTC+5:30)",
      "Governance Module",
      "Action / Event",
      "Authorizing Official",
      "Official Role",
      "Official Email",
      "Target / Fixture",
      "Operational Details & Notes",
      "Status",
    ];

    const dataRows = targetEvents.map((ev, index) => {
      const formattedDate = new Date(ev.timestamp).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      return [
        `"AUD-${String(index + 1).padStart(4, "0")}"`,
        `"${formattedDate}"`,
        `"${getHumanReadableModule(ev.category)}"`,
        `"${getHumanReadableAction(ev.action)}"`,
        `"${ev.actorName.replace(/"/g, '""')}"`,
        `"${ev.actorRole}"`,
        `"${ev.actorEmail || "N/A"}"`,
        `"${ev.target.replace(/"/g, '""')}"`,
        `"${ev.details.replace(/"/g, '""')}"`,
        `"${ev.status}"`,
      ].join(",");
    });

    // Combine banner, column headers, and data rows
    const csvString =
      bannerLines.join("\n") +
      columnHeaders.map((h) => `"${h}"`).join(",") +
      "\n" +
      dataRows.join("\n");

    // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens special characters correctly
    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `Sams_College_Audit_Trail_${slug}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    toast.success(
      `Exported ${targetEvents.length} filtered audit records (${slug})!`
    );
  };

  // Dedicated Print Engine (Renders standalone clean HTML in an isolated iframe for 100% reliable PDF generation)
  const handlePrintAuditLog = (targetList?: AuditEvent[], scopeTitle?: string) => {
    const targetEvents =
      targetList || (showPrintModal ? printableEvents : filteredEvents);

    if (targetEvents.length === 0) {
      toast.error("No audit logs match your filter to print");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1024px";
    iframe.style.height = "768px";
    iframe.style.border = "0";
    iframe.style.opacity = "0.01";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const auditorName = user
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : "Super Admin";
    const dateStr = new Date().toLocaleDateString(undefined, {
      dateStyle: "long",
    });
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const currentScope =
      scopeTitle ||
      (showPrintModal
        ? printFilterCategory === "ALL"
          ? "All Modules Combined"
          : getHumanReadableModule(printFilterCategory)
        : activeCategory === "ALL"
        ? "All Modules"
        : getHumanReadableModule(activeCategory));

    const rowsHtml = targetEvents
      .map((ev, idx) => {
        const formattedDate = new Date(ev.timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding: 6px 8px; font-weight: bold; color: #0284c7; text-align: center; font-size: 10px;">#${idx + 1}</td>
            <td style="padding: 6px 8px; font-size: 9.5px; color: #475569; white-space: nowrap;">${formattedDate}</td>
            <td style="padding: 6px 8px;">
              <div style="font-weight: 800; color: #0f172a; font-size: 10.5px;">${getHumanReadableAction(ev.action)}</div>
              <div style="color: #64748b; font-size: 8.5px; font-weight: 700; text-transform: uppercase;">${getHumanReadableModule(ev.category)}</div>
            </td>
            <td style="padding: 6px 8px; font-size: 10px;">
              <div style="font-weight: 700; color: #0f172a;">${ev.actorName}</div>
              <div style="color: #0284c7; font-size: 8.5px; font-weight: 800; text-transform: uppercase;">${ev.actorRole}</div>
            </td>
            <td style="padding: 6px 8px; font-size: 10px; color: #0f172a; font-weight: 600;">
              ${ev.target}
            </td>
            <td style="padding: 6px 8px; font-size: 9.5px; color: #475569; max-width: 240px;">
              ${ev.details}
            </td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 800; color: #047857; font-size: 9.5px;">
              ${ev.status}
            </td>
          </tr>
        `;
      })
      .join("");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <base href="${window.location.origin}/" />
          <title>Official System Security & Audit Trail - Sam's College</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm 12mm;
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
              padding: 14px 18px;
              background: #ffffff;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 10px;
              border-bottom: 1.5px solid #0f172a;
              margin-bottom: 10px;
            }
            .logo-box {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo-img {
              height: 40px;
              width: auto;
              object-fit: contain;
            }
            .title-box h1 {
              font-size: 16px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #0f172a;
            }
            .title-box p {
              font-size: 10px;
              font-weight: 600;
              color: #0284c7;
              font-family: monospace;
            }
            .summary-strip {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              padding: 8px 12px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              margin-bottom: 10px;
            }
            .meta-label {
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
            }
            .summary-val {
              font-size: 11.5px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 1px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              overflow: hidden;
              margin-bottom: 12px;
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
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 6px 8px;
              border-bottom: 1.5px solid #94a3b8;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              padding-top: 10px;
              border-top: 1.5px solid #0f172a;
              margin-top: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .sig-line {
              border-bottom: 1px solid #475569;
              padding-bottom: 2px;
              margin-top: 16px;
              font-style: italic;
              font-size: 10.5px;
              color: #0f172a;
              font-weight: 600;
            }
            .sig-title {
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
            }
            .sig-desc {
              font-size: 8px;
              color: #64748b;
              margin-top: 2px;
            }
            .footer-note {
              margin-top: 8px;
              font-size: 8px;
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
                <div style="height: 30px; width: 1.5px; background: #cbd5e1;"></div>
                <div class="title-box">
                  <h1>Official System Security & Audit Trail</h1>
                  <p>Verified Institutional Ledger · Sam's College Table Tennis Management System</p>
                </div>
              </div>
              <div style="text-align: right; font-size: 9px; color: #64748b; font-family: monospace;">
                <div>CLASSIFICATION: CONFIDENTIAL</div>
                <div style="font-weight: bold; color: #0284c7;">VERIFIED GOVERNANCE RECORD</div>
              </div>
            </div>

            <div class="summary-strip">
              <div>
                <div class="meta-label">Audit Scope</div>
                <div class="summary-val" style="color: #0284c7;">${currentScope}</div>
              </div>
              <div>
                <div class="meta-label">Total Audited Events</div>
                <div class="summary-val">${targetEvents.length} Verified Records</div>
              </div>
              <div>
                <div class="meta-label">Authorized Auditor</div>
                <div class="summary-val">${auditorName} (${user?.role || "SUPER_ADMIN"})</div>
              </div>
              <div>
                <div class="meta-label">Date & Time Generated</div>
                <div class="summary-val">${dateStr} · ${timeStr}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 35px; text-align: center;">#</th>
                  <th style="width: 120px;">Timestamp</th>
                  <th style="width: 180px;">Event / Action</th>
                  <th style="width: 140px;">Authorizing Official</th>
                  <th style="width: 150px;">Target Affected</th>
                  <th>Operational Notes</th>
                  <th style="width: 80px; text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="signatures">
              <div>
                <div class="sig-title">Super Admin / System Auditor</div>
                <div class="sig-line">${auditorName}</div>
                <div class="sig-desc">Signed & Certified Digital Audit Trail · Verified Database Ledger</div>
              </div>
              <div>
                <div class="sig-title">Institutional Examiner / Sports Board</div>
                <div class="sig-line" style="border-bottom-style: dotted;">&nbsp;</div>
                <div class="sig-desc">Official Examination Seal & Institutional Validation Signature</div>
              </div>
            </div>

            <div class="footer-note">
              Official Sam's College Table Tennis Management System · Tamper-Evident Security & Audit Trail · Confidential Document
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

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getBadgeClasses = (color: "emerald" | "cyan" | "amber" | "rose") => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "cyan":
        return "bg-[#4AEEFF]/20 text-[#4AEEFF] border-[#4AEEFF]/40";
      case "amber":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "rose":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-white/10 text-white/80 border-white/20";
    }
  };

  const getActorRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
      case "ADMIN":
        return "bg-purple-500/20 text-purple-300 border border-purple-500/40";
      case "REFEREE":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
      case "PLAYER":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      default:
        return "bg-white/10 text-white/70 border border-white/20";
    }
  };

  const wrapInBaseLayout = (children: React.ReactNode) => (
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

  return wrapInBaseLayout(
    <>
      {/* COLLEGIATE HEADER CONTROLS (Identical to Users.tsx & Dashboard.tsx) */}
      <header className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-cyan-200/80 mt-1">
            Super Admin oversight of referee officiating, payment verifications, club memberships, and account operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => fetchAuditLogs(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#4AEEFF]/40 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Sync latest live database logs"
          >
            <ArrowPathIcon
              className={`w-4 h-4 text-[#4AEEFF] ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Sync</span>
          </button>

          {/* Printable Official Report Trigger */}
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 hover:border-[#4AEEFF]/50 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Open printable official audit report"
          >
            <PrinterIcon className="w-4 h-4 text-[#4AEEFF]" />
            <span>Print Report</span>
          </button>

          {/* Enterprise CSV Export Trigger (Exports active filter results) */}
          <button
            type="button"
            onClick={() => handleExportCSV()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4AEEFF] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061D23] transition-all duration-200 hover:bg-white hover:shadow-lg hover:shadow-[#4AEEFF]/20 active:scale-95 cursor-pointer"
            title="Export filtered records as CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV ({filteredEvents.length})</span>
          </button>
        </div>
      </header>

      {/* METRICS OVERVIEW CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print print:hidden">
        <div className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/60">
              Total Events
            </p>
            <ShieldCheckIcon className="w-5 h-5 text-[#4AEEFF]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {metrics?.totalLogs ?? events.length}
          </p>
          <p className="mt-0.5 text-[11px] text-cyan-200/60">Recorded system activities</p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/60">
              Referee Duties
            </p>
            <TrophyIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
            {metrics?.refereeDutyCount ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-cyan-200/60">Completed match fixtures</p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/60">
              Payments Verified
            </p>
            <BanknotesIcon className="w-5 h-5 text-[#4AEEFF]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-[#4AEEFF]">
            {metrics?.paymentsProcessed ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-cyan-200/60">Tournament entry verifications</p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/60">
              User Accounts
            </p>
            <UserGroupIcon className="w-5 h-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-400">
            {metrics?.registeredAccounts ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-cyan-200/60">Athletes, referees & admins</p>
        </div>
      </section>

      {/* FILTER AND SEARCH CONTROLS */}
      <section className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print print:hidden">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: `All Logs (${events.length})` },
            { id: "REFEREE", label: `Referee Officiating (${events.filter(e => e.category === 'REFEREE').length})` },
            { id: "PAYMENT", label: `Payment Verifications (${events.filter(e => e.category === 'PAYMENT').length})` },
            { id: "MEMBERSHIP", label: `Club Memberships (${events.filter(e => e.category === 'MEMBERSHIP').length})` },
            { id: "USER", label: `Users & Ranks (${events.filter(e => e.category === 'USER').length})` },
            { id: "TOURNAMENT", label: `Tournaments (${events.filter(e => e.category === 'TOURNAMENT').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === tab.id
                  ? "bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                  : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[260px] md:w-80">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor, target, or details..."
            className="w-full pl-10 pr-8 py-2 bg-black/40 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#4AEEFF] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* AUDIT LOG TABLE */}
      <section className="rounded-2xl border border-white/20 bg-[#061D23]/20 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl overflow-hidden no-print print:hidden">
        {loading ? (
          <div className="flex h-[45vh] flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
              Loading system audit trail...
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <InformationCircleIcon className="w-12 h-12 text-white/30 mx-auto" />
            <p className="text-base font-bold text-white">No audit records found</p>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              No recorded system events match your search query or selected category filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/70 font-black uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">Event & Action</th>
                  <th className="py-4 px-6">Actor / Official</th>
                  <th className="py-4 px-6">Target Affected</th>
                  <th className="py-4 px-6">Operational Details</th>
                  <th className="py-4 px-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Action & Category */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getBadgeClasses(
                            ev.badgeColor
                          )}`}
                        >
                          {ev.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-semibold text-white/40 tracking-wider">
                          {ev.category}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-black text-xs text-[#4AEEFF] shrink-0">
                          {ev.actorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">
                            {ev.actorName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${getActorRoleBadge(
                                ev.actorRole
                              )}`}
                            >
                              {ev.actorRole}
                            </span>
                            {ev.actorEmail && (
                              <span className="text-[10px] text-white/40 truncate max-w-[150px]">
                                {ev.actorEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="py-4 px-6">
                      <span className="font-semibold text-white/90">
                        {ev.target}
                      </span>
                    </td>

                    {/* Operational Details */}
                    <td className="py-4 px-6 max-w-md">
                      <p className="text-white/70 leading-relaxed truncate">
                        {ev.details}
                      </p>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 text-white/50 text-[11px] font-medium">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{formatDateTime(ev.timestamp)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* OFFICIAL PRINTABLE SECURITY AUDIT REPORT MODAL */}
      {showPrintModal &&
        createPortal(
          <div className="printable-document-wrapper fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex justify-center items-center py-6 sm:py-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="printable-document-card bg-[#061D23]/95 border border-[#4AEEFF]/40 rounded-2xl max-w-4xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
              {/* Report Header with Official College Logo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/15">
                <div className="flex items-center gap-3">
                  <img
                    src={invertedLogo}
                    alt="Sam's College"
                    className="h-10 w-auto object-contain block shrink-0"
                  />
                  <div className="h-7 w-[1px] bg-white/20" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                      Official System Audit Trail
                    </h3>
                    <p className="text-[11px] text-[#4AEEFF] font-medium font-mono">
                      Institutional Activity, Referee Officiating & Financial Verification Log
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition self-end sm:self-auto"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Scope Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-[#4AEEFF]/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Audit Scope:
                  </span>
                  <select
                    value={printFilterCategory}
                    onChange={(e) => setPrintFilterCategory(e.target.value)}
                    className="rounded-lg border border-white/20 bg-[#061D23] px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#4AEEFF]"
                  >
                    <option value="ALL">All Modules Combined ({events.length} records)</option>
                    <option value="REFEREE">Referee Officiating ({events.filter(e => e.category === 'REFEREE').length})</option>
                    <option value="PAYMENT">Payment Verifications ({events.filter(e => e.category === 'PAYMENT').length})</option>
                    <option value="MEMBERSHIP">Club Memberships ({events.filter(e => e.category === 'MEMBERSHIP').length})</option>
                    <option value="USER">User Directory & Seeding ({events.filter(e => e.category === 'USER').length})</option>
                    <option value="TOURNAMENT">Tournament Management ({events.filter(e => e.category === 'TOURNAMENT').length})</option>
                  </select>
                </div>
                <span className="text-[11px] text-[#4AEEFF] font-mono">
                  Showing {printableEvents.length} records for print
                </span>
              </div>

              {/* Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                    Audited Records
                  </p>
                  <p className="text-white font-bold mt-0.5 text-sm font-mono">
                    {printableEvents.length} Events
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                    Authorized Auditor
                  </p>
                  <p className="text-[#4AEEFF] font-bold mt-0.5 text-xs truncate">
                    {user ? `${user.firstName} ${user.lastName || ""}` : "Super Admin"}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                    Report Date
                  </p>
                  <p className="text-white font-mono mt-0.5 text-xs">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                    Security Level
                  </p>
                  <p className="text-emerald-400 font-mono font-bold mt-0.5 text-xs">
                    VERIFIED · OFFICIAL
                  </p>
                </div>
              </div>

              {/* Table Preview */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="max-h-64 overflow-y-auto printable-table-scroll">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60 font-mono">
                        <th className="px-3 py-2 text-center w-10">#</th>
                        <th className="px-3 py-2">Timestamp</th>
                        <th className="px-3 py-2">Event / Action</th>
                        <th className="px-3 py-2">Official / Actor</th>
                        <th className="px-3 py-2">Target Affected</th>
                        <th className="px-3 py-2">Details</th>
                        <th className="px-3 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {printableEvents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3.5 py-6 text-center text-white/40 italic">
                            No recorded events found for this audit scope.
                          </td>
                        </tr>
                      ) : (
                        printableEvents.map((ev, idx) => (
                          <tr key={ev.id} className="hover:bg-white/5">
                            <td className="px-3 py-2 text-[#4AEEFF] font-bold text-center">
                              #{idx + 1}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-white/70 text-[10px]">
                              {formatDateTime(ev.timestamp)}
                            </td>
                            <td className="px-3 py-2 font-bold text-white">
                              {getHumanReadableAction(ev.action)}
                            </td>
                            <td className="px-3 py-2 text-white/90">
                              {ev.actorName} ({ev.actorRole})
                            </td>
                            <td className="px-3 py-2 text-white/80 font-semibold">
                              {ev.target}
                            </td>
                            <td className="px-3 py-2 text-white/70 max-w-xs truncate">
                              {ev.details}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-400">
                              {ev.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Signatures & Verification Block */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/10 text-xs">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Super Admin / System Auditor
                  </p>
                  <div className="border-b border-white/30 pb-1">
                    <span className="text-white/90 italic text-[11px] font-semibold">
                      {user ? `${user.firstName} ${user.lastName || ""}` : "System Super Administrator"}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 font-mono">
                    Verified Digital Audit Record · {new Date().toISOString().slice(0, 10)}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Institutional Examiner / Sports Board
                  </p>
                  <div className="border-b-2 border-dotted border-white/30 pb-1 h-5">
                    &nbsp;
                  </div>
                  <p className="text-[10px] text-white/50">
                    Official College Seal & Validation Signature
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <span className="text-[10px] text-white/40 italic">
                  Official Sam&apos;s College Table Tennis Management System
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handlePrintAuditLog(printableEvents, `Audit Scope: ${printFilterCategory === "ALL" ? "All Modules Combined" : getHumanReadableModule(printFilterCategory)}`)}
                    className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <PrinterIcon className="w-4 h-4 text-[#4AEEFF]" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleExportCSV(
                        printableEvents,
                        `Print Modal Scope: ${printFilterCategory === "ALL" ? "All Modules Combined" : getHumanReadableModule(printFilterCategory)}`,
                        printFilterCategory.toLowerCase()
                      )
                    }
                    className="rounded-xl border border-[#4AEEFF]/40 bg-[#4AEEFF]/10 hover:bg-[#4AEEFF]/20 px-4 py-2 text-xs font-bold text-[#4AEEFF] transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Export Filtered CSV ({printableEvents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="rounded-xl bg-[#4AEEFF] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default AuditLogs;
