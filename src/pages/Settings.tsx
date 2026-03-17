import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogOut,
  User,
  Bell,
  BarChart3,
  Monitor,
  FileText,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppSettings {
  leaseExpiryAlerts: boolean;
  leaseExpiryDays: string;
  vacancyAlerts: boolean;
  vacancyThreshold: number;
  monthlyReport: boolean;
  paymentReminders: boolean;
  emailDigest: string;
  fiscalYearStart: string;
  expenseRatioEstimate: number;
  targetDSCR: string;
  targetLTV: number;
  dateFormat: string;
  showVacantUnitsOnDashboard: boolean;
  defaultPeriod: string;
  documentCompanyName: string;
  documentWatermark: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  leaseExpiryAlerts: true,
  leaseExpiryDays: "60",
  vacancyAlerts: true,
  vacancyThreshold: 10,
  monthlyReport: true,
  paymentReminders: true,
  emailDigest: "weekly",
  fiscalYearStart: "January",
  expenseRatioEstimate: 40,
  targetDSCR: "1.25",
  targetLTV: 75,
  dateFormat: "MM/DD/YYYY",
  showVacantUnitsOnDashboard: true,
  defaultPeriod: "monthly",
  documentCompanyName: "164 Investments",
  documentWatermark: false,
};

const STORAGE_KEY = "164_settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <h2 className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
        {title}
      </h2>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  control,
  disabled = false,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-[14px]",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      <div className="space-y-0.5 pr-8 flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-snug">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const set = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "—";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your account and application preferences.
          </p>
        </div>

        {/* ── Account ───────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={User} title="Account" />
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 px-5 py-5">
                {/* Avatar */}
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {initials}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-semibold text-foreground">
                      {user?.name ?? "—"}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role ?? "—"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {user?.email ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.organization ?? "—"}
                  </p>
                </div>
                {/* Edit stub */}
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  Edit
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Bell} title="Notifications" />
          <Card className="overflow-hidden divide-y divide-border/50">
            <SettingsRow
              label="Lease expiry alerts"
              description="Get notified before leases expire"
              control={
                <Switch
                  checked={settings.leaseExpiryAlerts}
                  onCheckedChange={(v) => set("leaseExpiryAlerts", v)}
                />
              }
            />
            <SettingsRow
              label="Days before expiry"
              description="How far in advance to alert you"
              disabled={!settings.leaseExpiryAlerts}
              control={
                <Select
                  value={settings.leaseExpiryDays}
                  onValueChange={(v) => set("leaseExpiryDays", v)}
                >
                  <SelectTrigger className="h-8 w-28 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="45">45 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingsRow
              label="Vacancy rate alerts"
              description="Alert when portfolio vacancy exceeds threshold"
              control={
                <Switch
                  checked={settings.vacancyAlerts}
                  onCheckedChange={(v) => set("vacancyAlerts", v)}
                />
              }
            />
            <SettingsRow
              label="Vacancy threshold"
              description={`Alert above ${settings.vacancyThreshold}% vacancy`}
              disabled={!settings.vacancyAlerts}
              control={
                <div className="flex items-center gap-3">
                  <Slider
                    min={5}
                    max={30}
                    step={1}
                    value={[settings.vacancyThreshold]}
                    onValueChange={([v]) => set("vacancyThreshold", v)}
                    className="w-28"
                  />
                  <span className="text-sm font-semibold w-8 text-right tabular-nums">
                    {settings.vacancyThreshold}%
                  </span>
                </div>
              }
            />
            <SettingsRow
              label="Monthly portfolio report"
              description="Receive a summary at the end of each month"
              control={
                <Switch
                  checked={settings.monthlyReport}
                  onCheckedChange={(v) => set("monthlyReport", v)}
                />
              }
            />
            <SettingsRow
              label="Lease payment reminders"
              description="Remind about upcoming rent due dates"
              control={
                <Switch
                  checked={settings.paymentReminders}
                  onCheckedChange={(v) => set("paymentReminders", v)}
                />
              }
            />
            <SettingsRow
              label="Email digest"
              description="Frequency of summary emails"
              control={
                <Select
                  value={settings.emailDigest}
                  onValueChange={(v) => set("emailDigest", v)}
                >
                  <SelectTrigger className="h-8 w-28 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          </Card>
        </section>

        {/* ── Portfolio Preferences ──────────────────────────────────── */}
        <section>
          <SectionHeader icon={BarChart3} title="Portfolio Preferences" />
          <Card className="overflow-hidden divide-y divide-border/50">
            <SettingsRow
              label="Fiscal year start"
              description="First month of your financial year"
              control={
                <Select
                  value={settings.fiscalYearStart}
                  onValueChange={(v) => set("fiscalYearStart", v)}
                >
                  <SelectTrigger className="h-8 w-32 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "January","February","March","April","May","June",
                      "July","August","September","October","November","December",
                    ].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <SettingsRow
              label="Expense ratio estimate"
              description="Used for NOI when no actual expenses are entered"
              control={
                <div className="flex items-center gap-3">
                  <Slider
                    min={0}
                    max={60}
                    step={1}
                    value={[settings.expenseRatioEstimate]}
                    onValueChange={([v]) => set("expenseRatioEstimate", v)}
                    className="w-28"
                  />
                  <span className="text-sm font-semibold w-8 text-right tabular-nums">
                    {settings.expenseRatioEstimate}%
                  </span>
                </div>
              }
            />
            <SettingsRow
              label="Target DSCR"
              description="Minimum acceptable debt service coverage ratio"
              control={
                <Input
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.05}
                  value={settings.targetDSCR}
                  onChange={(e) => set("targetDSCR", e.target.value)}
                  className="h-8 w-20 text-sm text-right tabular-nums"
                />
              }
            />
            <SettingsRow
              label="Target LTV"
              description="Maximum desired loan-to-value ratio"
              control={
                <div className="flex items-center gap-3">
                  <Slider
                    min={50}
                    max={95}
                    step={1}
                    value={[settings.targetLTV]}
                    onValueChange={([v]) => set("targetLTV", v)}
                    className="w-28"
                  />
                  <span className="text-sm font-semibold w-8 text-right tabular-nums">
                    {settings.targetLTV}%
                  </span>
                </div>
              }
            />
          </Card>
        </section>

        {/* ── Display ───────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Monitor} title="Display" />
          <Card className="overflow-hidden divide-y divide-border/50">
            <SettingsRow
              label="Date format"
              control={
                <Select
                  value={settings.dateFormat}
                  onValueChange={(v) => set("dateFormat", v)}
                >
                  <SelectTrigger className="h-8 w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingsRow
              label="Show vacant units on Dashboard"
              description="Include vacant units in the vacancy loss KPI"
              control={
                <Switch
                  checked={settings.showVacantUnitsOnDashboard}
                  onCheckedChange={(v) =>
                    set("showVacantUnitsOnDashboard", v)
                  }
                />
              }
            />
            <SettingsRow
              label="Default reporting period"
              control={
                <Select
                  value={settings.defaultPeriod}
                  onValueChange={(v) => set("defaultPeriod", v)}
                >
                  <SelectTrigger className="h-8 w-32 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          </Card>
        </section>

        {/* ── Documents ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={FileText} title="Documents" />
          <Card className="overflow-hidden divide-y divide-border/50">
            <SettingsRow
              label="Company name on documents"
              description="Printed on generated PDFs"
              control={
                <Input
                  type="text"
                  maxLength={40}
                  value={settings.documentCompanyName}
                  onChange={(e) => set("documentCompanyName", e.target.value)}
                  className="h-8 w-48 text-sm"
                  placeholder="e.g. 164 Investments"
                />
              }
            />
            <SettingsRow
              label="Watermark on generated PDFs"
              description='Adds a "DRAFT" diagonal watermark'
              control={
                <Switch
                  checked={settings.documentWatermark}
                  onCheckedChange={(v) => set("documentWatermark", v)}
                />
              }
            />
          </Card>
        </section>

        {/* ── Danger Zone ───────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={ShieldAlert} title="Danger Zone" />
          <Card className="overflow-hidden border-destructive/20">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Sign out
                  </p>
                  <p className="text-xs text-muted-foreground">
                    End your current session
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Button>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between px-5 py-4 opacity-40">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Delete account
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permanently remove your account and data
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
