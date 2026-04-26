"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface Props {
  initialNotifications: Notification[];
  unreadCount: number;
  user: { name: string; email: string; organizationName: string };
}

export default function NotificationsClient({ initialNotifications, unreadCount: initialUnread, user }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const filtered = filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {} finally {
      setIsMarkingAll(false);
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.readAt) markAsRead(n.id);
    if (n.link) router.push(n.link);
  };

  const getIcon = (type: string) => {
    if (type.startsWith("WORK_ORDER"))
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      );
    if (type === "MACHINE_ALERT" || type === "MACHINE_BREAKDOWN")
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    if (type === "PARTS_LOW")
      return (
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      );
    if (type.startsWith("MAINTENANCE"))
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    return (
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1] px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[#8898aa] hover:text-[#0a2540] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0a2540]">Notifications</h1>
              <p className="text-xs text-[#8898aa]">{user.organizationName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount} unread
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAll}
                className="text-sm text-[#635bff] hover:text-[#4f46e5] font-medium disabled:opacity-50 transition-colors"
              >
                {isMarkingAll ? "Marking..." : "Mark all as read"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="flex gap-6">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === f
                    ? "border-[#635bff] text-[#635bff]"
                    : "border-transparent text-[#8898aa] hover:text-[#0a2540]"
                }`}
              >
                {f === "all" ? "All" : "Unread"}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e6ebf1] p-16 text-center">
            <svg className="w-14 h-14 text-[#c0ccda] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-[#425466] font-medium">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="mt-1 text-sm text-[#8898aa]">
              {filter === "unread" ? "You're all caught up! ✓" : "Notifications about your machines, work orders and alerts will appear here."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e6ebf1] divide-y divide-[#e6ebf1] overflow-hidden">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  !n.readAt ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-[#f6f9fc]"
                } ${n.link ? "cursor-pointer" : ""}`}
                onClick={() => handleClick(n)}
              >
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.readAt ? "font-semibold text-[#0a2540]" : "font-medium text-[#0a2540]"}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.readAt && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                      {n.readAt && (
                        <span className="text-xs text-[#c0ccda]">✓</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-[#425466]">{n.message}</p>
                  <p className="mt-1.5 text-xs text-[#8898aa]">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    {n.priority === "URGENT" && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Urgent</span>
                    )}
                    {n.priority === "HIGH" && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">High</span>
                    )}
                  </p>
                </div>
                {!n.readAt && (
                  <div className="flex-shrink-0 mt-1.5">
                    <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}