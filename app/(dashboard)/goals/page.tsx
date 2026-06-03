"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

interface Goal {
  id: string; name: string; icon: string; color: string;
  targetAmountCents: number; currentAmountCents: number;
  deadline: string | null; isCompleted: boolean;
}

const goalSchema = z.object({
  name: z.string().min(1, "Required"),
  targetAmountCents: z.coerce.number().min(1, "Must be > 0"),
  deadline: z.string().optional(),
  color: z.string(),
});

type GoalForm = z.infer<typeof goalSchema>;

const contributionSchema = z.object({ amount: z.coerce.number().min(0.01, "Must be > 0") });
type ContribForm = z.infer<typeof contributionSchema>;

function NewGoalForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema) as unknown as Resolver<GoalForm>,
    defaultValues: { color: "#3b82f6" },
  });

  async function onSubmit(d: GoalForm) {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, targetAmountCents: Math.round(d.targetAmountCents * 100) }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Goal created");
    reset();
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label>Goal Name</Label>
        <Input placeholder="e.g. Emergency Fund" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Target Amount ($)</Label>
          <Input type="number" step="0.01" {...register("targetAmountCents")} />
          {errors.targetAmountCents && <p className="text-xs text-destructive">{errors.targetAmountCents.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Deadline (optional)</Label>
          <Input type="date" {...register("deadline")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Color</Label>
        <Input type="color" {...register("color")} className="h-10 w-full cursor-pointer" />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create Goal"}
      </Button>
    </form>
  );
}

function ContributionForm({ goal, onSuccess }: { goal: Goal; onSuccess: () => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContribForm>({
    resolver: zodResolver(contributionSchema) as unknown as Resolver<ContribForm>,
  });

  async function onSubmit(d: ContribForm) {
    const newAmount = goal.currentAmountCents + Math.round(d.amount * 100);
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmountCents: newAmount }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Contribution added!");
    reset();
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Current: {formatCurrency(goal.currentAmountCents)} / {formatCurrency(goal.targetAmountCents)}
      </p>
      <div className="space-y-1">
        <Label>Contribution Amount ($)</Label>
        <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Add Contribution"}
      </Button>
    </form>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/goals");
    const json = await res.json();
    setGoals(json.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteGoalId) return;
    const res = await fetch(`/api/goals/${deleteGoalId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Goal deleted");
    load();
  }

  async function handleComplete(goal: Goal) {
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: true }),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Goal completed! 🎉");
    load();
  }

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger render={<Button size="sm"><Plus className="h-4 w-4 mr-1" />New Goal</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
            <NewGoalForm onSuccess={() => { setOpenAdd(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {active.length === 0 && completed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-2">🎯</p>
          <p>No goals yet. Create your first financial goal.</p>
        </div>
      ) : null}

      {active.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map((g) => {
            const pct = Math.min(Math.round((g.currentAmountCents / g.targetAmountCents) * 100), 100);
            return (
              <Card key={g.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: g.color + "33" }}>
                        🎯
                      </div>
                      <CardTitle className="text-base">{g.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteGoalId(g.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={pct} className="h-2" style={{ "--progress-color": g.color } as React.CSSProperties} />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold" style={{ color: g.color }}>{formatPercent(pct)}</span>
                    <span className="text-muted-foreground">{formatCurrency(g.currentAmountCents)} / {formatCurrency(g.targetAmountCents)}</span>
                  </div>
                  {g.deadline && <p className="text-xs text-muted-foreground">Due {formatDate(g.deadline)}</p>}
                  <div className="flex gap-2">
                    <Dialog open={contributeGoal?.id === g.id} onOpenChange={(o) => !o && setContributeGoal(null)}>
                      <DialogTrigger render={<Button size="sm" variant="outline" className="flex-1" onClick={() => setContributeGoal(g)}>Add Contribution</Button>} />
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add to {g.name}</DialogTitle></DialogHeader>
                        {contributeGoal && <ContributionForm goal={contributeGoal} onSuccess={() => { setContributeGoal(null); load(); }} />}
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="ghost" className="text-green-400" onClick={() => handleComplete(g)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Completed Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((g) => (
              <Card key={g.id} className="opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <CardTitle className="text-base line-through">{g.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{formatCurrency(g.targetAmountCents)} — Completed</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteGoalId}
        onOpenChange={(o) => !o && setDeleteGoalId(null)}
        title="Delete Goal?"
        description="This goal will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
