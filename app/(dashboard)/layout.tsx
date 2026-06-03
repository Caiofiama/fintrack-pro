import { Sidebar, BottomNav } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-0">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
