"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Dot,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock notifications data - replace with real API call
const mockNotifications = [
  {
    id: "1",
    title: "New podcast episode uploaded",
    message: "Tech Talk Weekly #45 has been successfully uploaded and is now live.",
    type: "success",
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    read: false,
    actionUrl: "/dashboard/podcasts",
  },
  {
    id: "2",
    title: "Live broadcast starting soon",
    message: "Morning Jazz Sessions will begin in 15 minutes.",
    type: "info",
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    actionUrl: "/dashboard/broadcasts",
  },
  {
    id: "3",
    title: "User feedback received",
    message: "John D. left a 5-star review for your latest audiobook chapter.",
    type: "success",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    actionUrl: "/dashboard/users",
  },
  {
    id: "4",
    title: "Storage limit warning",
    message: "You're approaching your storage limit. Consider upgrading your plan.",
    type: "warning",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: true,
    actionUrl: "/dashboard/settings",
  },
  {
    id: "5",
    title: "Weekly analytics report",
    message: "Your weekly performance report is ready for review.",
    type: "info",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    actionUrl: "/dashboard/analytics",
  },
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "success":
      return "bg-green-100 text-green-600";
    case "warning":
      return "bg-yellow-100 text-yellow-600";
    case "error":
      return "bg-red-100 text-red-600";
    default:
      return "bg-blue-100 text-blue-600";
  }
}

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1> */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs text-teal-600 hover:text-teal-700"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-96">
                <div className="p-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "relative p-3 rounded-lg mb-2 transition-colors cursor-pointer",
                          notification.read 
                            ? "bg-slate-50 hover:bg-slate-100" 
                            : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        )}
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl;
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "flex-shrink-0 w-2 h-2 rounded-full mt-2",
                            notification.read ? "bg-slate-300" : getNotificationIcon(notification.type)
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={cn(
                                "text-sm font-medium",
                                notification.read ? "text-slate-700" : "text-slate-900"
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <Dot className="h-4 w-4 text-teal-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className={cn(
                              "text-sm mt-1",
                              notification.read ? "text-slate-500" : "text-slate-600"
                            )}>
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-slate-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {getTimeAgo(notification.createdAt)}
                              {notification.actionUrl && (
                                <ExternalLink className="h-3 w-3 ml-2" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture || undefined} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-teal-600 text-white text-sm">
                    {getUserInitials(user?.name || null)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {user?.role || "user"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}