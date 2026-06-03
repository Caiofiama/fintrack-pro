"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KpiSkeleton, ChartSkeleton, TableSkeleton } from "@/components/skeletons";
import { CashflowChart, CategoryDonutChart } from "@/components/charts/overview-charts";
import { TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle } from "lucide-react";

interface Overview {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
}

interface CashflowEntry {
  month: string;
  income: number;
  expenses: number;
}

interface CategoryEntry {
  name: string;
  color: string;
  amountCents: number;
  percentage: number;
}

interface Transaction {
  id: string;
  description: string;
  amountCents: number;
  type: string;
  date: string;
  category: { name: string; icon: string; color: string };
  account: { name: string };
}

interface Budget {
  id: string;
  category: { name: string; color: string };
  amountCents: number;
  spentCents: number;
  percentage: number;
  alertThreshold: number;
}

interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmountCents: number;
  currentAmountCents: number;
  deadline: string | null;
  isCompleted: boolean;
}

interface Account {
  id: string;
  balanceCents: number;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [cashflow, setCashflow] = useState<CashflowEntry[]>([]);
  const [byCategory, setByCategory] = useState<CategoryEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = currentMonth();
    Promise.all([
      fetch(`/api/analytics/overview?month=${month}`).then((r) => r.json()),
      fetch(`/api/analytics/cashflow?months=6`).then((r) => r.json()),
      fetch(`/api/analytics/by-category?month=${month}&type=EXPENSE`).then((r) => r.json()),
      fetch(`/api/transactions?limit=10&offset=0`).then((r) => r.json()),
      fetch(`/api/budgets`).then((r) => r.json()),
      fetch(`/api/goals`).then((r) => r.json()),
      fetch(`/api/accounts`).then((r) => r.json()),
    ]).then(([ov, cf, bc, tx, bg, gl, ac]) => {
      setOverview(ov.data);
      setCashflow(cf.data ?? []);
      setByCategory(bc.data ?? []);
      setTransactions(tx.data ?? []);
      const alertBudgets = (bg.data ?? []).filter(
        (b: Budget) => b.percentage >= b.alertThreshold * 100
      );
      setBudgets(alertBudgets);
      setGoals((gl.data ?? []).filter((g: Goal) => !g.isCompleted).slice(0, 4));
      const bal = (ac.data ?? []).reduce((s: number, a: Account) => s + a.balanceCents, 0);
      setTotalBalance(bal);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <KpiSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalBalance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-400" /> Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-400">{formatCurrency(overview?.totalIncome ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" /> Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-400">{formatCurrency(overview?.totalExpenses ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Percent className="h-3.5 w-3.5" /> Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatPercent(overview?.savingsRate ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cash Flow — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            {cashflow.length > 0 ? <CashflowChart data={cashflow} /> : <p className="text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length > 0 ? <CategoryDonutChart data={byCategory} /> : <p className="text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" /> Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">All budgets are on track 🎉</p>
            ) : (
              budgets.map((b) => (
                <div key={b.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{b.category.name}</span>
                    <span className={b.percentage > 100 ? "text-red-400" : "text-yellow-400"}>
                      {formatCurrency(b.spentCents)} / {formatCurrency(b.amountCents)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(b.percentage, 100)}
                    className="h-1.5"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Goals Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active goals</p>
            ) : (
              goals.map((g) => {
                const pct = Math.min(Math.round((g.currentAmountCents / g.targetAmountCents) * 100), 100);
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{g.name}</span>
                      <span className="text-muted-foreground">{formatPercent(pct)}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(g.currentAmountCents)} of {formatCurrency(g.targetAmountCents)}
                      {g.deadline && ` · due ${formatDate(g.deadline)}`}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: tx.category.color + "33" }}
                    >
                      <span>{tx.category.icon === "tag" ? "🏷️" : "💳"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.account.name} · {formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs hidden sm:flex">{tx.category.name}</Badge>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        tx.type === "INCOME" ? "text-green-400" : tx.type === "EXPENSE" ? "text-red-400" : "text-blue-400"
                      }`}
                    >
                      {tx.type === "EXPENSE" ? "-" : "+"}{formatCurrency(tx.amountCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
