"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  type PieLabelRenderProps,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

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

const RADIAN = Math.PI / 180;

function CustomLabel(props: PieLabelRenderProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if ((percent as number) < 0.05) return null;
  const r = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5;
  const x = (cx as number) + r * Math.cos(-(midAngle as number) * RADIAN);
  const y = (cy as number) + r * Math.sin(-(midAngle as number) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {`${((percent as number) * 100).toFixed(0)}%`}
    </text>
  );
}

export function CashflowChart({ data }: { data: CashflowEntry[] }) {
  const formatted = data.map((d) => ({
    month: d.month,
    Income: d.income / 100,
    Expenses: d.expenses / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} barGap={4}>
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: unknown) => formatCurrency(Number(value) * 100)}
          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Bar dataKey="Income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expenses" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonutChart({ data }: { data: CategoryEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          dataKey="amountCents"
          nameKey="name"
          labelLine={false}
          label={CustomLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{value}</span>}
        />
        <Tooltip
          formatter={(value: unknown) => formatCurrency(Number(value))}
          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
