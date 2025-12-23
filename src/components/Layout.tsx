import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  Home,
  Wallet,
  FileText,
  PieChart,
  FileCheck,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Assets & Liabilities", href: "/assets", icon: Wallet },
  { name: "Generate PFS", href: "/generate", icon: FileCheck },
  { name: "Snapshots", href: "/snapshots", icon: History },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-xl hover:opacity-80 transition-opacity"
          >
            <PieChart className="h-6 w-6 text-primary" />
            <span className="text-foreground">164 Investments</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">{children}</main>
    </div>
  );
}
