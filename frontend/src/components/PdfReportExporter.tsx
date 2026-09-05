"use client";

import { VehicleSummaryDto, TrajectoryResponseDto } from "@/lib/api";

interface PdfReportExporterProps {
  summary: VehicleSummaryDto | null;
  trajectory: TrajectoryResponseDto | null;
}

export function PdfReportExporter({ summary, trajectory }: PdfReportExporterProps) {
  const handleExportPrint = () => {
    window.print();
  };

  if (!summary || !trajectory) return null;

  return (
    <div>
      <button
        type="button"
        onClick={handleExportPrint}
        className="flex items-center gap-1.5 rounded border border-sky-500/40 bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition-colors shadow-sm"
      >
        <span>📄</span>
        <span>Export Law Enforcement PDF Dossier</span>
      </button>

      {/* Hidden printable dossier overlay triggered on window.print() */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-50">
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold uppercase">Bharat Electronics Limited (BEL) — SIH26127</h1>
            <h2 className="text-md font-semibold text-gray-700">Official ANPR Vehicle Intelligence & Trajectory Dossier</h2>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Generated: {new Date().toISOString()}</p>
            <p>Classification: CONFIDENTIAL / LAW ENFORCEMENT</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm border p-3 rounded bg-gray-50">
          <div>
            <p><strong>License Plate:</strong> {summary.vehicle.plate}</p>
            <p><strong>Vehicle Type:</strong> {summary.vehicle.vehicleType || "Unknown"}</p>
            <p><strong>Primary Color:</strong> {summary.vehicle.color || "Unknown"}</p>
          </div>
          <div>
            <p><strong>First Seen:</strong> {summary.firstSeen || "N/A"}</p>
            <p><strong>Last Seen:</strong> {summary.lastSeen || "N/A"}</p>
            <p><strong>Cameras Visited:</strong> {summary.camerasVisited.join(" -> ")}</p>
          </div>
        </div>

        <h3 className="font-bold text-md mb-2 border-b pb-1">Chronological Trajectory Waypoints</h3>
        <table className="w-full text-xs text-left border-collapse mb-6">
          <thead>
            <tr className="bg-gray-200 border-b">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Camera Node</th>
              <th className="p-2 border">Timestamp</th>
              <th className="p-2 border">Coordinates</th>
              <th className="p-2 border">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {trajectory.points.map((pt, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2 border">{idx + 1}</td>
                <td className="p-2 border">{pt.cameraId} - {pt.cameraName}</td>
                <td className="p-2 border">{pt.timestamp}</td>
                <td className="p-2 border">{pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}</td>
                <td className="p-2 border">{pt.detectionConfidence ? `${(pt.detectionConfidence * 100).toFixed(0)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 pt-4 border-t flex justify-between text-xs text-gray-600">
          <div>
            <p>Investigating Officer Signature: _______________________</p>
          </div>
          <div>
            <p>Digital Verification Seal: BEL-SIH26127-AUTH-SEC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
