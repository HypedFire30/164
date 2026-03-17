import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Properties", href: "/properties" },
  { name: "Personal", href: "/personal" },
  { name: "Business", href: "/business" },
  { name: "Documents", href: "/documents" },
];

/** Navbar rendered at the App level (outside AnimatePresence) so position:fixed works correctly. */
export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,1100px)] rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18),0_0_0_1px_hsl(var(--border)/0.3)]">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Brand */}
        <Link to="/" className="shrink-0 hover:opacity-80 transition-opacity">
          <span className="font-bold text-xl tracking-tight text-foreground">
            164 Investments
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/" || location.pathname === "/dashboard"
                : location.pathname === item.href ||
                  location.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "relative text-sm font-medium transition-colors duration-150 py-1",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
                {isActive && (
                  <span className="absolute -bottom-[calc(0.375rem+1px)] left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings + Sign out */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => navigate("/settings")}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-150"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={handleLogout}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <main className="container px-8 pt-24 pb-8">{children}</main>
    </div>
  );
}
