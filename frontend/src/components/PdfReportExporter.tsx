"use client";

import { useState } from "react";
import { VehicleSummaryDto, TrajectoryResponseDto } from "@/lib/api";

interface PdfReportExporterProps {
  summary: VehicleSummaryDto | null;
  trajectory: TrajectoryResponseDto | null;
}

export function PdfReportExporter({ summary, trajectory }: PdfReportExporterProps) {
  const [dossierMeta, setDossierMeta] = useState<{ generatedAt: string; dossierId: string }>({
    generatedAt: "",
    dossierId: "",
  });

  if (!summary || !trajectory) return null;

  const handleExportPrint = () => {
    const printDate = new Date();
    setDossierMeta({
      generatedAt: printDate.toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: "Asia/Kolkata",
      }),
      dossierId: `BEL-${summary.vehicle.plate}-${printDate.getTime().toString(36).toUpperCase()}`,
    });
    window.print();
  };

  return (
    <>
      {/* Print trigger button — visible on screen only */}
      <button
        type="button"
        onClick={handleExportPrint}
        className="neo-btn flex w-full items-center justify-center gap-2.5 px-5 py-3.5 sm:py-4 text-sm sm:text-base font-mono font-black uppercase tracking-wider cursor-pointer"
      >
        <span className="text-base sm:text-lg">📄</span>
        <span>Export Law Enforcement Dossier</span>
      </button>

      {/*
        Hidden on screen; becomes the ONLY visible element on print
        via @media print rules in globals.css (.print-dossier class).
      */}
      <div className="print-dossier" style={{ display: "none" }}>
        {/* Header */}
        <div style={{ borderBottom: "3px solid #000", paddingBottom: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px" }}>
              🏙️ City AI Traffic Intelligence — SYS-01
            </div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginTop: "2px" }}>
              Official ANPR Vehicle Intelligence &amp; Trajectory Dossier
            </div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
              Bharat Electronics Limited (BEL) · Smart India Hackathon 2026
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
            <div><strong>Generated:</strong> {dossierMeta.generatedAt || summary.lastSeen || "OFFICIAL RECORD"}</div>
            <div><strong>Classification:</strong> CONFIDENTIAL / LAW ENFORCEMENT</div>
            <div><strong>Dossier ID:</strong> {dossierMeta.dossierId || `BEL-${summary.vehicle.plate}`}</div>
          </div>
        </div>

        {/* Vehicle Intelligence */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", borderBottom: "1px solid #d1d5db", paddingBottom: "4px", marginBottom: "10px" }}>
            🎯 Target Vehicle Intelligence
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#f9fafb", padding: "12px", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "700" }}>License Plate</div>
              <div style={{ fontSize: "20px", fontWeight: "900", fontFamily: "monospace", letterSpacing: "3px", color: "#0f172a" }}>{summary.vehicle.plate}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "700" }}>Vehicle Type</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}>{summary.vehicle.vehicleType || "Unclassified"}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "700" }}>Color</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}>{summary.vehicle.color || "Unknown"}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "700" }}>Make / Model</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}>{summary.vehicle.make || "—"} {summary.vehicle.model || ""}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "700" }}>First Detected</div>
              <div style={{ fontSize: "12px", fontWeight: "600", fontFamily: "monospace" }}>{summary.firstSeen ? new Date(summary.firstSeen).toLocaleString("en-IN") : "N/A"}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "700" }}>Last Detected</div>
              <div style={{ fontSize: "12px", fontWeight: "600", fontFamily: "monospace" }}>{summary.lastSeen ? new Date(summary.lastSeen).toLocaleString("en-IN") : "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Trajectory Statistics */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", borderBottom: "1px solid #d1d5db", paddingBottom: "4px", marginBottom: "10px" }}>
            📊 Trajectory Statistics
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
            {[
              { label: "Camera Nodes Visited", value: summary.cameraCount },
              { label: "Total Detections", value: summary.detectionCount },
              { label: "Estimated Distance", value: trajectory.estimatedDistanceKm ? `${trajectory.estimatedDistanceKm.toFixed(1)} km` : "—" },
              { label: "Estimated Duration", value: trajectory.estimatedDurationMinutes ? `${trajectory.estimatedDurationMinutes} min` : "—" },
              { label: "Overall Confidence", value: trajectory.overallConfidence ? `${(trajectory.overallConfidence * 100).toFixed(1)}%` : "—" },
              { label: "Route Checkpoints", value: trajectory.points.length },
              { label: "Cameras Path", value: summary.camerasVisited.join(" → ") || "—" },
              { label: "Warning Flag", value: trajectory.warning || "None" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "#f3f4f6", padding: "8px", borderRadius: "4px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase", fontWeight: "700" }}>{stat.label}</div>
                <div style={{ fontSize: "13px", fontWeight: "800", fontFamily: "monospace", marginTop: "2px" }}>{String(stat.value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chronological Waypoints */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", borderBottom: "1px solid #d1d5db", paddingBottom: "4px", marginBottom: "10px" }}>
            📍 Chronological Trajectory Waypoints
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#1e293b", color: "white" }}>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #334155" }}>#</th>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #334155" }}>Camera Node</th>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #334155" }}>Timestamp (IST)</th>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #334155" }}>Coordinates</th>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #334155" }}>Direction</th>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #334155" }}>Detection Conf.</th>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #334155" }}>Plate Conf.</th>
              </tr>
            </thead>
            <tbody>
              {trajectory.points.map((pt, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={{ padding: "5px 8px", border: "1px solid #e5e7eb", fontWeight: "700", fontFamily: "monospace" }}>{idx + 1}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #e5e7eb", fontWeight: "600" }}>{pt.cameraId} — {pt.cameraName}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #e5e7eb", fontFamily: "monospace", fontSize: "10px" }}>
                    {new Date(pt.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </td>
                  <td style={{ padding: "5px 8px", border: "1px solid #e5e7eb", fontFamily: "monospace", fontSize: "10px" }}>
                    {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                  </td>
                  <td style={{ padding: "5px 8px", border: "1px solid #e5e7eb" }}>{pt.direction || "—"}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #e5e7eb", fontWeight: "700" }}>
                    {pt.detectionConfidence != null ? `${(pt.detectionConfidence * 100).toFixed(0)}%` : "—"}
                  </td>
                  <td style={{ padding: "5px 8px", border: "1px solid #e5e7eb", fontWeight: "700" }}>
                    {pt.plateConfidence != null ? `${(pt.plateConfidence * 100).toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "2px solid #000", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280" }}>
          <div>
            <div style={{ fontWeight: "700", color: "#000" }}>Investigating Officer Signature:</div>
            <div style={{ marginTop: "20px", borderBottom: "1px solid #000", width: "200px" }}></div>
            <div style={{ marginTop: "4px" }}>Name &amp; Designation</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "700", color: "#000" }}>Digital Verification Seal</div>
            <div style={{ fontFamily: "monospace", marginTop: "4px" }}>BEL-TRAFFIC-AUTH-SEC</div>
            <div style={{ marginTop: "4px" }}>This document is classified CONFIDENTIAL.</div>
            <div>Unauthorized disclosure is an offence under IT Act 2000.</div>
          </div>
        </div>
      </div>
    </>
  );
}
