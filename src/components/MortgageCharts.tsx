import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Move, TrendingUp, DollarSign, Calendar, PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/domain/utils";
import type { PaymentSchedule, LoanSummary } from "@/lib/calculations/loan-calculator";

interface MortgageChartsProps {
  loanSummary: LoanSummary;
  propertyValue: number;
  currentBalance: number;
  monthlyPayment: number;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  destructive: "#ef4444",
  muted: "#6b7280",
};

export function MortgageCharts({
  loanSummary,
  propertyValue,
  currentBalance,
  monthlyPayment,
}: MortgageChartsProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedYearRange, setSelectedYearRange] = useState<[number, number] | null>(null);

  // Prepare amortization data (balance over time)
  const amortizationData = useMemo(() => {
    const schedule = loanSummary.amortizationSchedule;
    const yearlyData: Array<{
      year: number;
      month: number;
      balance: number;
      principal: number;
      interest: number;
      equity: number;
    }> = [];

    schedule.forEach((payment, index) => {
      const date = new Date(payment.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const equity = propertyValue - payment.remainingBalance;

      yearlyData.push({
        year,
        month: index + 1,
        balance: payment.remainingBalance,
        principal: payment.principalPayment,
        interest: payment.interestPayment,
        equity: Math.max(0, equity),
      });
    });

    // Group by year for cleaner visualization
    const yearlyGrouped = yearlyData.reduce((acc, item) => {
      const yearKey = item.year;
      if (!acc[yearKey]) {
        acc[yearKey] = {
          year: yearKey,
          balance: item.balance,
          totalPrincipal: 0,
          totalInterest: 0,
          equity: item.equity,
          payments: 0,
        };
      }
      acc[yearKey].totalPrincipal += item.principal;
      acc[yearKey].totalInterest += item.interest;
      acc[yearKey].payments += 1;
      acc[yearKey].balance = item.balance; // Last balance of the year
      acc[yearKey].equity = item.equity; // Last equity of the year
      return acc;
    }, {} as Record<number, any>);

    return Object.values(yearlyGrouped);
  }, [loanSummary.amortizationSchedule, propertyValue]);

  // Payment breakdown data (principal vs interest)
  const paymentBreakdown = useMemo(() => {
    const schedule = loanSummary.amortizationSchedule;
    const totalPrincipal = schedule.reduce((sum, p) => sum + p.principalPayment, 0);
    const totalInterest = schedule.reduce((sum, p) => sum + p.interestPayment, 0);

    return [
      { name: "Principal", value: totalPrincipal, color: COLORS.primary },
      { name: "Interest", value: totalInterest, color: COLORS.warning },
    ];
  }, [loanSummary.amortizationSchedule]);

  // Remaining payments timeline
  const remainingPaymentsData = useMemo(() => {
    const schedule = loanSummary.amortizationSchedule;
    const currentDate = new Date();
    const futurePayments = schedule.filter((p) => new Date(p.date) > currentDate);

    // Group by year
    const yearlyPayments = futurePayments.reduce((acc, payment) => {
      const year = new Date(payment.date).getFullYear();
      if (!acc[year]) {
        acc[year] = { year, count: 0, total: 0 };
      }
      acc[year].count += 1;
      acc[year].total += payment.totalPayment;
      return acc;
    }, {} as Record<number, { year: number; count: number; total: number }>);

    return Object.values(yearlyPayments).map((item) => ({
      year: item.year.toString(),
      payments: item.count,
      total: item.total,
    }));
  }, [loanSummary.amortizationSchedule]);

  // Equity growth data
  const equityData = useMemo(() => {
    return amortizationData.map((item) => ({
      year: item.year,
      equity: item.equity,
      balance: item.balance,
    }));
  }, [amortizationData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Badge variant="secondary">{Math.round(zoomLevel * 100)}%</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Move className="h-4 w-4" />
          <span>Drag to pan, scroll to zoom</span>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Amortization Schedule - Balance Over Time */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Loan Balance Over Time</CardTitle>
            </div>
            <CardDescription>Remaining principal balance by year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={amortizationData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="year"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  name="Remaining Balance"
                />
                <ReferenceLine
                  y={currentBalance}
                  stroke={COLORS.warning}
                  strokeDasharray="5 5"
                  label={{ value: "Current", position: "right" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Breakdown - Principal vs Interest */}
        <Card className="border-l-4 border-l-warning">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-warning" />
              <CardTitle>Payment Breakdown</CardTitle>
            </div>
            <CardDescription>Total principal vs interest paid</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{payload[0].name}</p>
                          <p className="text-sm">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-6">
              {paymentBreakdown.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equity Growth Over Time */}
        <Card className="border-l-4 border-l-success md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <CardTitle>Equity Growth</CardTitle>
            </div>
            <CardDescription>Property equity accumulation over loan term</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={equityData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="year"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  dot={{ fill: COLORS.success, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Equity"
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={COLORS.muted}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Remaining Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Remaining Payments Timeline */}
        <Card className="border-l-4 border-l-destructive md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-destructive" />
              <CardTitle>Remaining Payments Timeline</CardTitle>
            </div>
            <CardDescription>Payment schedule by year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={remainingPaymentsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="year"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload as any;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">Year {data.year}</p>
                          <p className="text-sm text-muted-foreground">
                            Payments: {data.payments}
                          </p>
                          <p className="text-sm">
                            Total: {formatCurrency(data.total)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="total"
                  fill={COLORS.destructive}
                  name="Total Payments"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
