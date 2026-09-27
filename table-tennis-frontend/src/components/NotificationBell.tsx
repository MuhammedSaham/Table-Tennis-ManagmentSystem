import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      const data = response.data.data;
      setNotifications(data);
      const unread = data.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);

      // Fetch pending doubles invites to enable quick actions (players only)
      if (user?.role === "PLAYER") {
        try {
          const invitesRes = await api.get("/teams/invites/my-invites");
          setPendingInvites(invitesRes.data.data || []);
        } catch {
          // Ignored if user not player
        }
      } else {
        setPendingInvites([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleAcceptInvite = async (e: React.MouseEvent, inviteId: string, notifId: string) => {
    e.stopPropagation();
    setActionLoadingId(inviteId);
    try {
      await api.post(`/teams/invites/${inviteId}/accept`);
      toast.success("Doubles invite accepted! Team confirmed 🎉");
      await markAsRead(notifId);
      fetchNotifications();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to accept invite";
      if (msg.includes("already been responded to")) {
        toast.success("This invite is already confirmed!");
        await markAsRead(notifId);
        fetchNotifications();
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (e: React.MouseEvent, inviteId: string, notifId: string) => {
    e.stopPropagation();
    setActionLoadingId(inviteId);
    try {
      await api.post(`/teams/invites/${inviteId}/decline`);
      toast.success("Invite declined");
      await markAsRead(notifId);
      fetchNotifications();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to decline invite";
      if (msg.includes("already been responded to")) {
        toast.success("This invite has already been responded to");
        await markAsRead(notifId);
        fetchNotifications();
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    await markAsRead(notif.id);
    setShowDropdown(false);

    // Navigate based on notification type
    if (notif.type === "TOURNAMENT_CREATED") {
      window.location.href = "/tournaments";
    } else if (notif.type === "NEW_ADMIN_REQUEST") {
      window.location.href = "/admin-requests";
    } else if (notif.type === "DOUBLES_INVITE" || notif.type.includes("DOUBLES")) {
      window.location.href = "/app/dashboard";
    }
  };

  const extractInviteId = (message: string): string | null => {
    const match = message.match(/Invite ID:\s*([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const getIcon = (type: string) => {
    if (type === "TOURNAMENT_CREATED") {
      return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
    }
    if (type === "NEW_ADMIN_REQUEST") {
      return <UserGroupIcon className="w-5 h-5 text-purple-500" />;
    }
    if (type === "DOUBLES_INVITE" || type.includes("DOUBLES")) {
      return <UserGroupIcon className="w-5 h-5 text-[#4AEEFF]" />;
    }
    if (type.includes("APPROVED")) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    if (type.includes("REJECTED")) {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
    return <BellIcon className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-300 hover:text-white rounded-full hover:bg-[#0f2b33] transition-colors"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px] min-h-[18px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:bg-transparent"
            onClick={() => setShowDropdown(false)}
          />

          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-auto sm:right-0 top-20 sm:top-auto mt-2 w-auto sm:w-96 max-w-md bg-[#082229] rounded-2xl shadow-2xl border border-cyan-500/30 z-50 overflow-hidden backdrop-blur-xl text-white">
            <div className="flex justify-between items-center p-3.5 border-b border-white/10 bg-[#061D23]/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#4AEEFF]"></span>
                <h3 className="font-black text-xs uppercase tracking-wider text-white">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-[#4AEEFF] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-white/50 text-xs">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <BellIcon className="w-10 h-10 text-white/20 mx-auto mb-2" />
                  <p className="text-white/50 text-xs uppercase tracking-wider font-bold">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const extractedId = extractInviteId(notif.message);
                  const isPendingDoublesInvite =
                    notif.type === "DOUBLES_INVITE" &&
                    Boolean(extractedId && pendingInvites.some((inv) => inv.id === extractedId));

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 hover:bg-white/5 cursor-pointer transition-colors ${!notif.isRead ? "bg-[#4AEEFF]/10" : ""}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-black/40 border border-white/10">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-white">
                            {notif.title}
                          </p>
                          <p className="text-xs text-white/70 mt-1 leading-relaxed">
                            {notif.message.replace(/Invite ID:\s*[a-zA-Z0-9]+/, "")}
                          </p>
                          <p className="text-[10px] text-white/40 font-mono mt-1">
                            {new Date(notif.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          {/* Quick Interactive Actions for Doubles Invites */}
                          {notif.type === "DOUBLES_INVITE" && (
                            isPendingDoublesInvite && extractedId ? (
                              <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/10">
                                <button
                                  onClick={(e) => handleAcceptInvite(e, extractedId, notif.id)}
                                  disabled={actionLoadingId === extractedId}
                                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all"
                                >
                                  {actionLoadingId === extractedId ? "..." : "✓ Accept"}
                                </button>
                                <button
                                  onClick={(e) => handleDeclineInvite(e, extractedId, notif.id)}
                                  disabled={actionLoadingId === extractedId}
                                  className="px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[11px] font-bold transition-all"
                                >
                                  ✕ Decline
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 text-[11px] font-bold text-emerald-400/90 flex items-center gap-1 pt-1.5 border-t border-white/10">
                                <span>✓</span> Responded / Confirmed
                              </div>
                            )
                          )}
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-[#4AEEFF] rounded-full mt-1 flex-shrink-0 shadow-[0_0_8px_#4AEEFF]"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
