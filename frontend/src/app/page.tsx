import { SystemStatusBar } from "@/components/SystemStatusBar";

const SECTIONS = [
  { title: "Vehicle Search", note: "Registration search, historical / live / combined mode" },
  { title: "Interactive Map", note: "Camera network, routes, live vehicle position" },
  { title: "Vehicle Intelligence", note: "Identity, cameras visited, distance, confidence" },
  { title: "Detection Timeline", note: "Chronological camera detections with evidence links" },
  { title: "Camera Evidence", note: "Frame-level CCTV evidence for a selected detection" },
  { title: "City Traffic Summary", note: "Network-wide analytics and congestion overview" },
];

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

      <main className="flex-1 px-6 py-8">
        <p className="mb-6 max-w-2xl text-sm text-zinc-400">
          Project skeleton is running. Backend connectivity is verified above via{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-300">
            GET /api/health
          </code>
          . The sections below are placeholders for the investigation workflow implemented in
          later build phases.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <h2 className="text-sm font-medium text-zinc-100">{section.title}</h2>
              <p className="mt-1 text-xs text-zinc-500">{section.note}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
