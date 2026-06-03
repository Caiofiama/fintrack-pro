"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User { id: string; name: string; email: string; }
interface Category { id: string; name: string; type: string; isDefault: boolean; color: string; }

const profileSchema = z.object({
  name: z.string().min(2, "Min 2 chars"),
  email: z.string().email("Invalid email"),
  currentPassword: z.string().min(1, "Required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Min 8 chars"),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [newCatColor, setNewCatColor] = useState("#6b7280");

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((j) => {
      setUser(j.data);
      profileForm.reset({ name: j.data.name, email: j.data.email, currentPassword: "" });
    });
    fetch("/api/categories").then((r) => r.json()).then((j) => setCategories([...(j.data?.income ?? []), ...(j.data?.expense ?? [])]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onProfileSubmit(d: ProfileForm) {
    const res = await fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Profile updated");
    setUser(json.data);
  }

  async function onPasswordSubmit(d: PasswordForm) {
    const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Password changed");
    passwordForm.reset();
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) { toast.error("Category name is required"); return; }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim(), type: newCatType, color: newCatColor, icon: "tag" }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Category created");
    setNewCatName("");
    const cr = await fetch("/api/categories").then((r) => r.json());
    setCategories([...(cr.data?.income ?? []), ...(cr.data?.expense ?? [])]);
  }

  async function handleDeleteCategory() {
    if (!deleteCatId) return;
    const res = await fetch(`/api/categories/${deleteCatId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Category deleted");
    setCategories((prev) => prev.filter((c) => c.id !== deleteCatId));
  }

  async function handleDeleteAccount() {
    if (!user || deleteEmail !== user.email) { toast.error("Email does not match"); return; }
    const res = await fetch("/api/auth/me", { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...profileForm.register("name")} />
              {profileForm.formState.errors.name && <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...profileForm.register("email")} />
              {profileForm.formState.errors.email && <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Current Password (to confirm changes)</Label>
              <Input type="password" placeholder="••••••••" {...profileForm.register("currentPassword")} />
              {profileForm.formState.errors.currentPassword && <p className="text-xs text-destructive">{profileForm.formState.errors.currentPassword.message}</p>}
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? "Saving…" : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input type="password" placeholder="••••••••" {...passwordForm.register("currentPassword")} />
              {passwordForm.formState.errors.currentPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" placeholder="••••••••" {...passwordForm.register("newPassword")} />
              {passwordForm.formState.errors.newPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
            </div>
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? "Changing…" : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1" />
            <Select value={newCatType} onValueChange={(v) => setNewCatType(v as "INCOME" | "EXPENSE")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
            <Input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="w-12 cursor-pointer p-1" />
            <Button onClick={handleAddCategory} size="sm">Add</Button>
          </div>
          <Separator />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm">{c.name}</span>
                  <Badge variant="outline" className="text-xs">{c.type}</Badge>
                  {c.isDefault && <Badge variant="outline" className="text-xs text-muted-foreground">default</Badge>}
                </div>
                {!c.isDefault && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteCatId(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action is irreversible.</p>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>Delete My Account</Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Account?"
        description={`Type your email (${user?.email ?? ""}) to confirm deletion.`}
        confirmLabel="Delete Account"
        destructive
        onConfirm={handleDeleteAccount}
      />

      {showDeleteDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle className="text-destructive">Delete Account</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Type your email <strong>{user?.email}</strong> to confirm.</p>
              <Input placeholder="your@email.com" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDeleteAccount} disabled={deleteEmail !== user?.email}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteCatId}
        onOpenChange={(o) => !o && setDeleteCatId(null)}
        title="Delete Category?"
        description="This only works if no transactions use this category."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
