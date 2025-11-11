"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Radio,
  Headphones,
  BookOpen,
  Calendar,
  Users,
  Settings,
  Menu,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Mic,
  BarChart3,
  FileText,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import DashboardAuthWrapper from "@/components/auth/dashboard-auth-wrapper";
import DashboardHeader from "@/components/dashboard-header";
import { DashboardSettingsProvider } from "@/contexts/dashboard-settings-context";

const mainNavigation = [
  {name:"Dashboard", href:"/dashboard",icon: LayoutDashboard},
  { name: "Broadcasts", href: "/dashboard/broadcasts", icon: Radio },
  { name: "Assets", href: "/dashboard/assets", icon: FolderOpen },
  { name: "Archives", href: "/dashboard/archives", icon: Archive },
  { name: "Podcasts", href: "/dashboard/podcasts", icon: Headphones },
  { name: "Audiobooks", href: "/dashboard/audiobooks", icon: BookOpen },
  { name: "Programs", href: "/dashboard/programs", icon: Mic },
  { name: "Schedules", href: "/dashboard/schedules", icon: Calendar },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Staff", href: "/dashboard/staff", icon: User },
];

const bottomNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DashboardAuthWrapper>
      <DashboardSettingsProvider>
        <div className="min-h-screen bg-slate-50">
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
              sidebarCollapsed ? "lg:w-16" : "lg:w-72"
            )}
          >
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <Link
                  href="/"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <Radio className="h-8 w-8 text-brand-500" />
                  {!sidebarCollapsed && (
                    <span className="ml-2 text-xl font-bold text-brand-600">
                      Cinema Book
                    </span>
                  )}
                </Link>
              </div>

              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="self-end mb-2 h-8 w-8 p-0"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {mainNavigation.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          pathname?.startsWith(item.href + "/");
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={cn(
                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors",
                                isActive
                                  ? "bg-brand-50 text-brand-600"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-brand-600",
                                sidebarCollapsed ? "justify-center" : ""
                              )}
                              title={sidebarCollapsed ? item.name : undefined}
                            >
                              <item.icon className="h-5 w-5 shrink-0" />
                              {!sidebarCollapsed && <span>{item.name}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>

                  {/* Bottom Navigation */}
                  <li className="mt-auto">
                    <ul role="list" className="-mx-2 space-y-1">
                      {bottomNavigation.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          pathname?.startsWith(item.href + "/");
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={cn(
                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors",
                                isActive
                                  ? "bg-brand-50 text-brand-600"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-brand-600",
                                sidebarCollapsed ? "justify-center" : ""
                              )}
                              title={sidebarCollapsed ? item.name : undefined}
                            >
                              <item.icon className="h-5 w-5 shrink-0" />
                              {!sidebarCollapsed && <span>{item.name}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div
            className={cn(
              "flex flex-col min-h-screen transition-all duration-300",
              sidebarCollapsed ? "lg:pl-16" : "lg:pl-72"
            )}
          >
            {/* Dashboard Header */}
            <DashboardHeader />

            {/* Page content */}
            <main className="flex-1">
              <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </main>

            {/* Footer */}
            <footer className="bg-brand-800 text-white mt-auto">
              <div className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-c  ols-2 lg:grid-cols-4 gap-8 mb-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Radio className="h-8 w-8 text-white-400" />
                      <span className="font-bold text-xl">Cinema Book</span>
                    </div>
                    <p className="text-brand-100 mb-4">
                      Your premier destination for podcasts, audiobooks, and
                      live broadcasts that inspire, entertain, and connect.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-lg mb-4">
                      Quick Links
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        <Link
                          href="/about"
                          className=" text-white"
                        >
                          About Us
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/programs"
                          className=""
                        >
                          Programs
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/podcasts"
                          className=""
                        >
                          Podcasts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/events"
                          className=""
                        >
                          Events
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/contact"
                          className=""
                        >
                          Contact
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-lg mb-4">
                      Resources
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        <Link
                          href="/help"
                          className=""
                        >
                          Help Center
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/advertise"
                          className=""
                        >
                          Advertise With Us
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/careers"
                          className=""
                        >
                          Careers
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/privacy"
                          className=""
                        >
                          Privacy Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/terms"
                          className=""
                        >
                          Terms of Service
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-lg mb-4">
                      Subscribe
                    </h3>
                    <p className="text-brand-100 mb-4">
                      Subscribe to our newsletter for updates on new content and
                      events.
                    </p>
                    <form className="space-y-2">
                      <input
                        type="email"
                        placeholder="Your email address"
                        className="w-full px-3 py-2 bg-brand-700 border border-brand-600 text-white placeholder:text-brand-200 rounded"
                      />
                      <button className="w-full bg-white py-2 px-4 rounded text-teal-800">
                        Subscribe
                      </button>
                    </form>
                  </div>
                </div>

                <div className="border-t border-brand-700 pt-6 flex flex-col md:flex-row justify-between items-center">
                  <p className="text-brand-200 text-sm">
                    © {new Date().getFullYear()} WaveStream. All rights
                    reserved.
                  </p>
                  <div className="flex space-x-4 mt-4 md:mt-0">
                    <Link
                      href="/privacy"
                      className="text-brand-200 hover:text-amber-200 text-sm transition-colors"
                    >
                      Privacy
                    </Link>
                    <Link
                      href="/terms"
                      className="text-brand-200 hover:text-amber-200 text-sm transition-colors"
                    >
                      Terms
                    </Link>
                    <Link
                      href="/cookies"
                      className="text-brand-200 hover:text-amber-200 text-sm transition-colors"
                    >
                      Cookies
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </DashboardSettingsProvider>
    </DashboardAuthWrapper>
  );
}