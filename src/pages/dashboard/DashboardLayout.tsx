import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Bot,
  Briefcase,
  Clock,
  Home,
  LogOut,
  MessageSquare,
  PenLine,
  Search,
  Settings,
  ShoppingCart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  hideMobile?: boolean;
};

const nav: NavItem[] = [
  { to: "/app", label: "Overview", icon: Home },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/research", label: "Research", icon: Search },
  { to: "/app/shopping", label: "Shopping", icon: ShoppingCart },
  { to: "/app/social", label: "Social", icon: PenLine },
  { to: "/app/career", label: "Career", icon: Briefcase },
  { to: "/app/jobs", label: "Activity", icon: Clock, hideMobile: true },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout() {
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M6 18c0-6 4.5-9.5 10-9.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="19" cy="8.5" r="2.5" fill="currentColor" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">
            LifeWithLLM
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app" || item.to === "/app/chat"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => void signOut().then(() => navigate("/"))}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">LifeWithLLM</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void signOut().then(() => navigate("/"))}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="md:pl-60">
        <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-card px-2 py-1 md:hidden">
        {nav
          .filter((item) => !item.hideMobile)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app" || item.to === "/app/chat"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
