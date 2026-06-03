"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Plus, Trash2, Pencil } from "lucide-react";

interface Budget {
  id: string;
  amountCents: number;
  periodType: string;
  spentCents: number;
  percentage: number;
  alertThreshold: number;
  category: { id: string; name: string; color: string };
}

interface Category { id: string; name: string; type: string; }

const schema = z.object({
  categoryId: z.string().min(1, "Required"),
  amountCents: z.coerce.number().min(1, "Must be > 0"),
  periodType: z.enum(["MONTHLY", "WEEKLY", "YEARLY"]),
  startDate: z.string().min(1, "Required"),
  alertThreshold: z.coerce.number().min(0.1).max(1),
});

type FormData = z.infer<typeof schema>;

function BudgetForm({ categories, defaultValues, onSuccess, editId }: {
  categories: Category[]; defaultValues?: Partial<FormData>; onSuccess: () => void; editId?: string;
}) {
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: defaultValues ?? { periodType: "MONTHLY", alertThreshold: 0.8, startDate: new Date().toISOString().slice(0, 7) + "-01" },
  });

  async function onSubmit(d: FormData) {
    const url = editId ? `/api/budgets/${editId}` : "/api/budgets";
    const res = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, amountCents: Math.round(d.amountCents * 100) }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success(editId ? "Budget updated" : "Budget created");
    reset();
    onSuccess();
  }

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label>Category</Label>
        <Select defaultValue={defaultValues?.categoryId} onValueChange={(v) => setValue("categoryId", v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>{expenseCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Limit ($)</Label>
          <Input type="number" step="0.01" {...register("amountCents")} />
          {errors.amountCents && <p className="text-xs text-destructive">{errors.amountCents.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Period</Label>
          <Select defaultValue={defaultValues?.periodType ?? "MONTHLY"} onValueChange={(v) => setValue("periodType", (v ?? "MONTHLY") as FormData["periodType"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Start Date</Label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div className="space-y-1">
          <Label>Alert at (%)</Label>
          <Input type="number" step="0.05" min="0.1" max="1" placeholder="0.8" {...register("alertThreshold")} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : editId ? "Update Budget" : "Create Budget"}
      </Button>
    </form>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);

  async function load() {
    const [br, cr] = await Promise.all([fetch("/api/budgets").then((r) => r.json()), fetch("/api/categories").then((r) => r.json())]);
    setBudgets(br.data ?? []);
    setCategories([...(cr.data?.income ?? []), ...(cr.data?.expense ?? [])]);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteBudgetId) return;
    const res = await fetch(`/api/budgets/${deleteBudgetId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Budget deleted");
    load();
  }

  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  function getColor(pct: number, threshold: number) {
    if (pct >= 100) return "text-red-400";
    if (pct >= threshold * 100) return "text-yellow-400";
    return "text-green-400";
  }

  function getProgressColor(pct: number, threshold: number) {
    if (pct >= 100) return "[&>div]:bg-red-500";
    if (pct >= threshold * 100) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-green-500";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">Evaluating: {monthLabel}</p>
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger render={<Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Budget</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>New Budget</DialogTitle></DialogHeader>
            <BudgetForm categories={categories} onSuccess={() => { setOpenAdd(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-2">📊</p>
          <p>No budgets yet. Create your first budget.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category.color }} />
                    <CardTitle className="text-base">{b.category.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{b.periodType}</Badge>
                    <Dialog open={editBudget?.id === b.id} onOpenChange={(o) => !o && setEditBudget(null)}>
                      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditBudget(b)}><Pencil className="h-3.5 w-3.5" /></Button>} />
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Budget</DialogTitle></DialogHeader>
                        <BudgetForm categories={categories} editId={b.id}
                          defaultValues={{ categoryId: b.category.id, amountCents: b.amountCents / 100, periodType: b.periodType as FormData["periodType"], alertThreshold: b.alertThreshold, startDate: new Date().toISOString().slice(0, 10) }}
                          onSuccess={() => { setEditBudget(null); load(); }} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteBudgetId(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={Math.min(b.percentage, 100)} className={`h-2 ${getProgressColor(b.percentage, b.alertThreshold)}`} />
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${getColor(b.percentage, b.alertThreshold)}`}>
                    {formatPercent(b.percentage)} used
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(b.spentCents)} / {formatCurrency(b.amountCents)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteBudgetId}
        onOpenChange={(o) => !o && setDeleteBudgetId(null)}
        title="Delete Budget?"
        description="This budget will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
