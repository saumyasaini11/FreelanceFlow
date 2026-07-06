"use client"

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Clock, 
  FileText, 
  Settings, 
  Menu, 
  LogOut,
  User as UserIcon,
  Activity,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation';

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Time Tracker", href: "/time-tracking", icon: Clock },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => pathname?.startsWith(path));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card/30 backdrop-blur-md">
        <div className="flex h-16 items-center px-6 border-b border-border gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            FreelanceFlow
          </span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 justify-between">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0 transition-colors" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border pt-4">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center border border-border">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button 
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border px-6 bg-card/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold tracking-tight">
            {navigation.find(item => item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href))?.name || "Overview"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center border border-border cursor-pointer hover:bg-accent/80 transition-colors">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
