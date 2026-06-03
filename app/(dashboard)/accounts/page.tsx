"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Plus, Archive, Wallet, CreditCard, PiggyBank, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Account {
  id: string; name: string; type: string; balanceCents: number; color: string; icon: string;
}

const schema = z.object({
  name: z.string().min(1, "Required"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT", "INVESTMENT"]),
  balanceCents: z.coerce.number(),
  color: z.string(),
});

type FormData = z.infer<typeof schema>;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  CHECKING: <Wallet className="h-5 w-5" />,
  SAVINGS: <PiggyBank className="h-5 w-5" />,
  CREDIT: <CreditCard className="h-5 w-5" />,
  INVESTMENT: <TrendingUp className="h-5 w-5" />,
};

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Checking", SAVINGS: "Savings", CREDIT: "Credit Card", INVESTMENT: "Investment",
};

function AccountForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: { type: "CHECKING", color: "#3b82f6", balanceCents: 0 },
  });

  async function onSubmit(d: FormData) {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, balanceCents: Math.round(d.balanceCents * 100) }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Account created");
    reset();
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="space-y-1">
        <Label>Account Name</Label>
        <Input placeholder="e.g. Main Checking" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Type</Label>
        <Select defaultValue="CHECKING" onValueChange={(v) => setValue("type", (v ?? "CHECKING") as FormData["type"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Initial Balance ($)</Label>
        <Input type="number" step="0.01" placeholder="0.00" {...register("balanceCents")} />
      </div>
      <div className="space-y-1">
        <Label>Color</Label>
        <Input type="color" {...register("color")} className="h-10 w-full cursor-pointer" />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create Account"}
      </Button>
    </form>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/accounts");
    const json = await res.json();
    setAccounts(json.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleArchive() {
    if (!archiveId) return;
    const res = await fetch(`/api/accounts/${archiveId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Account archived");
    load();
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balanceCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Account</Button>} />
          <SheetContent>
            <SheetHeader><SheetTitle>New Account</SheetTitle></SheetHeader>
            <AccountForm onSuccess={() => { setOpen(false); load(); }} />
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Net Worth</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🏦</p>
            <p>No accounts yet. Add your first account.</p>
          </div>
        ) : (
          accounts.map((a) => (
            <Card key={a.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: a.color }} />
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" style={{ color: a.color }}>
                    {TYPE_ICONS[a.type] ?? <Wallet className="h-5 w-5" />}
                    <span className="font-semibold">{a.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{TYPE_LABELS[a.type]}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold tabular-nums ${a.balanceCents < 0 ? "text-red-400" : ""}`}>
                  {formatCurrency(a.balanceCents)}
                </p>
                <div className="flex gap-2 mt-3">
                  <Link href={`/transactions?accountId=${a.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">View Transactions</Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setArchiveId(a.id)}>
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(o) => !o && setArchiveId(null)}
        title="Archive Account?"
        description="The account will be hidden. This only works if there are no transactions."
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />
    </div>
  );
}
