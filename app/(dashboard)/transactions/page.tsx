"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Plus, Download, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT = 20;

interface Transaction {
  id: string;
  description: string;
  amountCents: number;
  type: string;
  date: string;
  notes: string | null;
  category: { id: string; name: string; color: string };
  account: { id: string; name: string };
}

interface Account { id: string; name: string; }
interface Category { id: string; name: string; type: string; }

const txSchema = z.object({
  description: z.string().min(1, "Required"),
  amountCents: z.coerce.number().min(0.01, "Must be > 0"),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  date: z.string().min(1, "Required"),
  accountId: z.string().min(1, "Required"),
  categoryId: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

type TxForm = z.infer<typeof txSchema>;

function TransactionForm({ accounts, categories, defaultValues, onSuccess, editId }: {
  accounts: Account[]; categories: Category[]; defaultValues?: Partial<TxForm>;
  onSuccess: () => void; editId?: string;
}) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<TxForm>({
    resolver: zodResolver(txSchema) as unknown as Resolver<TxForm>,
    defaultValues: defaultValues ?? { type: "EXPENSE", date: new Date().toISOString().slice(0, 10) },
  });
  const type = watch("type");
  const filteredCats = categories.filter((c) =>
    type === "INCOME" ? c.type === "INCOME" : type === "EXPENSE" ? c.type === "EXPENSE" : true
  );

  async function onSubmit(data: TxForm) {
    const url = editId ? `/api/transactions/${editId}` : "/api/transactions";
    const res = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, amountCents: Math.round(data.amountCents * 100) }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success(editId ? "Transaction updated" : "Transaction added");
    reset();
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Description</Label>
          <Input placeholder="e.g. Grocery shopping" {...register("description")} />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Amount ($)</Label>
          <Input type="number" step="0.01" placeholder="0.00" {...register("amountCents")} />
          {errors.amountCents && <p className="text-xs text-destructive">{errors.amountCents.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" {...register("date")} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select defaultValue={defaultValues?.type ?? "EXPENSE"} onValueChange={(v) => setValue("type", (v ?? "EXPENSE") as TxForm["type"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Account</Label>
          <Select defaultValue={defaultValues?.accountId} onValueChange={(v) => setValue("accountId", v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Category</Label>
          <Select defaultValue={defaultValues?.categoryId} onValueChange={(v) => setValue("categoryId", v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Notes (optional)</Label>
          <Input placeholder="Optional notes" {...register("notes")} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : editId ? "Update Transaction" : "Add Transaction"}
      </Button>
    </form>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterAccount, setFilterAccount] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
    if (search) p.set("search", search);
    if (filterType !== "ALL") p.set("type", filterType);
    if (filterAccount !== "ALL") p.set("accountId", filterAccount);
    if (filterCategory !== "ALL") p.set("categoryId", filterCategory);
    const res = await fetch(`/api/transactions?${p}`);
    const json = await res.json();
    setTransactions(json.data ?? []);
    setTotal(json.meta?.total ?? 0);
    setLoading(false);
  }, [offset, search, filterType, filterAccount, filterCategory]);

  useEffect(() => {
    Promise.all([fetch("/api/accounts").then((r) => r.json()), fetch("/api/categories").then((r) => r.json())]).then(
      ([ac, ca]) => { setAccounts(ac.data ?? []); setCategories([...(ca.data?.income ?? []), ...(ca.data?.expense ?? [])]); }
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTxId) return;
    const res = await fetch(`/api/transactions/${deleteTxId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    load();
  }

  async function handleExport() {
    const res = await fetch("/api/transactions/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger render={<Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
              <TransactionForm accounts={accounts} categories={categories} onSuccess={() => { setOpenAdd(false); load(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} />
            <Select value={filterType} onValueChange={(v) => { setFilterType(v ?? "ALL"); setOffset(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAccount} onValueChange={(v) => { setFilterAccount(v ?? "ALL"); setOffset(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Accounts</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v ?? "ALL"); setOffset(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm text-muted-foreground">{total} transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground"><p className="text-4xl mb-2">💸</p><p>No transactions found</p></div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tx.category.color + "33", color: tx.category.color }}>
                      {tx.category.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)} · {tx.account.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="hidden sm:flex text-xs">{tx.category.name}</Badge>
                    <Badge variant="outline" className={`text-xs ${tx.type === "INCOME" ? "text-green-400 border-green-400/30" : tx.type === "EXPENSE" ? "text-red-400 border-red-400/30" : "text-blue-400 border-blue-400/30"}`}>
                      {tx.type}
                    </Badge>
                    <span className={`text-sm font-semibold tabular-nums w-24 text-right ${tx.type === "INCOME" ? "text-green-400" : tx.type === "EXPENSE" ? "text-red-400" : "text-blue-400"}`}>
                      {tx.type === "EXPENSE" ? "-" : "+"}{formatCurrency(tx.amountCents)}
                    </span>
                    <Dialog open={editTx?.id === tx.id} onOpenChange={(o) => !o && setEditTx(null)}>
                      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTx(tx)}><Pencil className="h-3.5 w-3.5" /></Button>} />
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
                        <TransactionForm accounts={accounts} categories={categories} editId={tx.id}
                          defaultValues={{ description: tx.description, amountCents: tx.amountCents / 100, type: tx.type as TxForm["type"], date: tx.date.slice(0, 10), accountId: tx.account.id, categoryId: tx.category.id, notes: tx.notes ?? "" }}
                          onSuccess={() => { setEditTx(null); load(); }} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTxId(tx.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTxId}
        onOpenChange={(o) => !o && setDeleteTxId(null)}
        title="Delete Transaction?"
        description="This will revert the account balance. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
