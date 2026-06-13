import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

import { EyeIcon } from "@heroicons/react/24/outline";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log("Fetching notifications..."); // Debug log
      const response = await api.get("/notifications");
      console.log("Notifications response:", response.data); // Debug log
      const data = response.data.data;
      setNotifications(data);
      const unread = data.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);
      console.log(`Found ${data.length} notifications, ${unread} unread`); // Debug log
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

  const handleNotificationClick = async (notif: Notification) => {
    await markAsRead(notif.id);
    setShowDropdown(false);

    // Navigate based on notification type
    if (notif.type === "TOURNAMENT_CREATED") {
      window.location.href = "/tournaments";
    } else if (notif.type === "NEW_ADMIN_REQUEST") {
      window.location.href = "/admin-requests";
    }
  };

  const getIcon = (type: string) => {
    if (type === "TOURNAMENT_CREATED") {
      return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
    }
    if (type === "NEW_ADMIN_REQUEST") {
      return <UserGroupIcon className="w-5 h-5 text-purple-500" />;
    }
    if (type.includes("APPROVED")) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    if (type.includes("REJECTED")) {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
    return <BellIcon className="w-5 h-5 text-blue-500" />;

    if (type === "PROFILE_VIEW") {
      return <EyeIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
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
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? "bg-blue-50" : ""}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
