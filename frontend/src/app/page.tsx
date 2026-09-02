import { SystemStatusBar } from "@/components/SystemStatusBar";
import { InvestigationDashboard } from "@/components/InvestigationDashboard";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 px-6 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">SIH26127</p>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
            City AI Traffic Intelligence
          </h1>
        </div>
        <SystemStatusBar />
      </header>

      <InvestigationDashboard />
    </div>
  );
}
