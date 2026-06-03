"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "@/components/skeletons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

interface Overview {
  totalIncome: number; totalExpenses: number; netBalance: number; savingsRate: number;
}

interface CashflowEntry { month: string; income: number; expenses: number; }
interface CategoryEntry { name: string; color: string; amountCents: number; percentage: number; }

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function monthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [cashflow, setCashflow] = useState<CashflowEntry[]>([]);
  const [byCategory, setByCategory] = useState<CategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const m = monthStr(selectedMonth);
    Promise.all([
      fetch(`/api/analytics/overview?month=${m}`).then((r) => r.json()),
      fetch(`/api/analytics/cashflow?months=12`).then((r) => r.json()),
      fetch(`/api/analytics/by-category?month=${m}&type=EXPENSE`).then((r) => r.json()),
    ]).then(([ov, cf, bc]) => {
      setOverview(ov.data);
      setCashflow(cf.data ?? []);
      setByCategory(bc.data ?? []);
      setLoading(false);
    });
  }, [selectedMonth]);

  const top5 = [...byCategory].sort((a, b) => b.amountCents - a.amountCents).slice(0, 5);
  const totalExpenses = byCategory.reduce((s, c) => s + c.amountCents, 0);
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const avgDailySpend = totalExpenses / daysInMonth;

  const lineData = cashflow.map((d) => ({
    month: d.month,
    Income: d.income / 100,
    Expenses: d.expenses / 100,
  }));

  const displayMonth = selectedMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedMonth((m) => addMonths(m, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-36 text-center">{displayMonth}</span>
          <Button variant="outline" size="icon" onClick={() => setSelectedMonth((m) => addMonths(m, 1))} disabled={monthStr(addMonths(selectedMonth, 1)) > monthStr(new Date())}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Income", value: overview?.totalIncome ?? 0, color: "text-green-400" },
          { label: "Expenses", value: overview?.totalExpenses ?? 0, color: "text-red-400" },
          { label: "Net Balance", value: overview?.netBalance ?? 0, color: (overview?.netBalance ?? 0) >= 0 ? "text-green-400" : "text-red-400" },
          { label: "Avg Daily Spend", value: avgDailySpend, color: "text-foreground" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Line Chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Income vs Expenses — Last 12 Months</CardTitle></CardHeader>
        <CardContent>
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v) * 100)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="hsl(var(--income))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Expenses" stroke="hsl(var(--expense))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Spending by Category</CardTitle></CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton /> : byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expense data for this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" outerRadius={85} dataKey="amountCents" nameKey="name">
                    {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top 5 Expense Categories</CardTitle></CardHeader>
          <CardContent>
            {top5.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {top5.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{c.name}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{c.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-right w-20 shrink-0">{formatCurrency(c.amountCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
