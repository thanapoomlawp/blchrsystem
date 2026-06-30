import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  GitBranch,
  UserPlus,
  Menu as MenuIcon,
  X,
  Bell,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "แดชบอร์ด", url: "/", icon: LayoutDashboard },
  { title: "ข้อมูลพนักงาน", url: "/employees", icon: Users },
  { title: "บันทึกเวลา", url: "/attendance", icon: ClipboardCheck },
  { title: "การลา", url: "/leave", icon: Calendar },
  { title: "โครงสร้างองค์กร", url: "/organization", icon: GitBranch },
  { title: "ผู้สมัครงาน", url: "/applicants", icon: UserPlus },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (url) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <div className="min-h-screen flex bg-[#F0F2F8]" style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-gradient-to-b from-[#0D1B40] to-[#162552]
        shadow-2xl transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#F0C94A] flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-[#0D1B40]" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">BLC HR</div>
            <div className="text-[#C9A227] text-xs font-medium">System</div>
          </div>
          <button className="ml-auto md:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${active
                    ? "bg-[#C9A227] text-[#0D1B40] shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#0D1B40]" : "text-white/60 group-hover:text-white"}`} />
                <span>{item.title}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto text-[#0D1B40]" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-white/30 text-xs text-center">BLC HR System v1.0</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 md:px-8 gap-4 sticky top-0 z-20 shadow-sm">
          <button
            className="md:hidden text-gray-500 hover:text-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <span className="text-gray-400 text-sm hidden sm:block">
              {navigationItems.find(i => isActive(i.url))?.title || "BLC HR System"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-800 relative">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D1B40] to-[#C9A227] flex items-center justify-center text-white font-bold text-sm shadow">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}