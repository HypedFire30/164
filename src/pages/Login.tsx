import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  TrendingUp,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  BarChart3,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

const panelVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};

const formPanelVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};

const features = [
  { icon: Building2, text: "Multi-property portfolio tracking" },
  { icon: TrendingUp, text: "Equity & mortgage analytics" },
  { icon: BarChart3, text: "Amortization & cash flow insights" },
  { icon: Shield, text: "Loan document generation" },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/dashboard";

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate async auth delay for UX smoothness
    await new Promise((r) => setTimeout(r, 650));

    const success = login(email, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setIsLoading(false);
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      {/* Left branding panel */}
      <motion.div
        className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(217 91% 12%) 0%, hsl(217 91% 22%) 50%, hsl(200 80% 28%) 100%)",
        }}
        variants={panelVariants}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-[-120px] right-[-120px] w-[480px] h-[480px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[40%] left-[60%] w-[200px] h-[200px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />

        {/* Brand */}
        <motion.div
          className="relative z-10 flex items-center gap-3"
          initial={{ opacity: 0, y: -16 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">
            Dashboard
          </span>
        </motion.div>

        {/* Center content */}
        <motion.div
          className="relative z-10 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants} className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              164 Investments
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Professional real estate management for Portland's investment
              community.
            </p>
          </motion.div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <motion.div
                key={text}
                variants={itemVariants}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white/80" />
                </div>
                <span className="text-white/70 text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="relative z-10 text-white/30 text-xs"
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          © 2026 164 Investments · Portland, OR
        </motion.p>
      </motion.div>

      {/* Right form panel */}
      <motion.div
        className="flex-1 flex items-center justify-center p-8"
        variants={formPanelVariants}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
      >
        <motion.div
          className="w-full max-w-sm space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
        >
          {/* Mobile logo */}
          <motion.div
            variants={itemVariants}
            className="lg:hidden flex items-center gap-2 mb-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-lg">164 Investments</span>
          </motion.div>

          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in to your portfolio dashboard
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="email"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  className="text-destructive text-xs px-1"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-70 group"
                style={{ background: "hsl(var(--primary))" }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <motion.span
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in…
                    </motion.span>
                  ) : (
                    <motion.span className="flex items-center gap-2">
                      Sign in
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                    </motion.span>
                  )}
                </span>
                {/* Hover shimmer */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/8 transition-colors duration-200" />
              </button>
            </motion.div>
          </form>

          <motion.p
            variants={itemVariants}
            className="text-center text-xs text-muted-foreground/60"
          >
            Internal tool for portfolio management
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
