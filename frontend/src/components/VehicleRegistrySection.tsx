"use client";

import { useState, useEffect } from "react";
import { TiltCard3D } from "./TiltCard3D";
import { getVehicleRegistryRecord, fetchVehicleRegistryRecord, type IndianVehicleRcRecord } from "@/lib/registry";

interface VehicleRegistrySectionProps {
  plateNumber: string;
  className?: string;
  defaultExpanded?: boolean;
}

export function VehicleRegistrySection({
  plateNumber = "MH12AB1234",
  className = "",
  defaultExpanded = true,
}: VehicleRegistrySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMasked, setIsMasked] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "technical" | "compliance">("all");
  const [fetchedRecord, setFetchedRecord] = useState<IndianVehicleRcRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (getVehicleRegistryRecord(plateNumber)) {
      return;
    }
    const timer = setTimeout(() => {
      if (!cancelled) setIsLoading(true);
    }, 0);

    fetchVehicleRegistryRecord(plateNumber)
      .then((res) => {
        if (!cancelled) {
          if (res.success && res.data) {
            setFetchedRecord(res.data);
          } else {
            setFetchedRecord(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFetchedRecord(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [plateNumber]);

  const record = getVehicleRegistryRecord(plateNumber) ?? fetchedRecord;

  return (
    <TiltCard3D className={className}>
      <div className="neo-box overflow-hidden">
        {/* Dedicated Box Header Strip */}
        <div className="neo-header">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
                VAHAN Vehicle Registry
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded-xs w-fit">
                FORM 23 RC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-xs hover:bg-slate-100 cursor-pointer"
            >
              {isExpanded ? "Collapse ▲" : "Expand ▼"}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isExpanded && (
          record ? (
            <div className="p-4 space-y-4 font-mono">
              {/* Top Official Banner & Source Reference */}
              <div className="rounded-md border border-slate-300 bg-gradient-to-r from-slate-50 to-sky-50/50 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white font-bold text-sm shadow-xs">
                    🏛️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-950 uppercase tracking-tight">
                      Ministry of Road Transport &amp; Highways (MoRTH)
                    </div>
                    <div className="text-[10px] text-slate-600 font-sans">
                      Government of India • Parivahan Sewa
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href="https://parivahan.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-xs transition-colors"
                  >
                    <span>🔗 parivahan.gov.in</span>
                    <span className="text-[8px]">↗</span>
                  </a>
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-xs">
                    <span>✓ VAHAN VERIFIED</span>
                  </span>
                </div>
              </div>

              {/* HSRP Plate Display & Privacy Controls */}
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Visual HSRP Plate Frame */}
                <div className="relative flex items-center h-11 rounded-md border-2 border-slate-900 bg-white px-3 shadow-xs whitespace-nowrap w-fit">
                  <div className="flex flex-col items-center justify-center mr-2.5 pr-2 border-r border-slate-300 text-blue-900">
                    <span className="text-[8px] font-bold leading-none">🇮🇳</span>
                    <span className="text-[9px] font-black tracking-tighter">IND</span>
                  </div>
                  <span className="text-base sm:text-lg font-black tracking-widest text-slate-950 font-mono whitespace-nowrap">
                    {record.formattedPlate}
                  </span>
                  <span className="ml-3 text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-xs">
                    {record.rcStatus}
                  </span>
                </div>

                {/* Privacy Mask Toggle Only */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsMasked(!isMasked)}
                    className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer shadow-xs whitespace-nowrap"
                    title="Toggle privacy masking for sensitive owner identity"
                  >
                    {isMasked ? "👁️ Unmask Details" : "🔒 Mask Details"}
                  </button>
                </div>
              </div>
            </div>

            {/* Category Navigation Tabs */}
            <div className="flex items-center gap-1.5 rounded-md bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab("all")}
                className={`flex-1 py-1 px-2 rounded-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Overview &amp; Ownership
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("technical")}
                className={`flex-1 py-1 px-2 rounded-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === "technical" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Technical Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("compliance")}
                className={`flex-1 py-1 px-2 rounded-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === "compliance" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Validities &amp; Compliance
              </button>
            </div>

            {/* TAB 1: Overview & Ownership */}
            {(activeSubTab === "all" || activeSubTab === "technical") && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Registration &amp; Ownership Particulars
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Registering Authority (RTO)</span>
                    <span className="font-bold text-slate-950 mt-0.5 block">{record.registeringAuthority}</span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered Owner Name</span>
                    <span className="font-bold text-slate-950 mt-0.5 block">
                      {isMasked ? record.maskedOwnerName : record.ownerName} ({record.ownerSerial})
                    </span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Father / Husband Name</span>
                    <span className="font-bold text-slate-950 mt-0.5 block">
                      {isMasked ? record.maskedFatherName : record.fatherHusbandName}
                    </span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Hypothecation (Financier)</span>
                    <span className="font-bold text-slate-950 mt-0.5 block">
                      {record.hypothecationBank ?? "None (Owned Clear)"}
                    </span>
                  </div>

                  <div className="sm:col-span-2 rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Permanent Registered Address</span>
                    <span className="font-medium text-slate-900 mt-0.5 block">
                      {isMasked ? record.maskedAddress : record.permanentAddress}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Technical Specifications */}
            {(activeSubTab === "all" || activeSubTab === "technical") && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Vehicle Structural &amp; Mechanical Specs
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Maker</span>
                    <span className="font-bold text-slate-950">{record.maker}</span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Model / Class</span>
                    <span className="font-bold text-slate-950">{record.model}</span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Vehicle Class</span>
                    <span className="font-bold text-slate-950">{record.vehicleClass}</span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Fuel Type</span>
                    <span className="font-bold text-slate-950">{record.fuelType}</span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Emission Norms</span>
                    <span className="font-bold text-emerald-700">{record.emissionNorms}</span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Cubic Capacity</span>
                    <span className="font-bold text-slate-950">{record.cubicCapacity}</span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Chassis Number</span>
                    <span className="font-bold text-slate-950 font-mono">
                      {isMasked ? record.maskedChassisNumber : record.chassisNumber}
                    </span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Engine Number</span>
                    <span className="font-bold text-slate-950 font-mono">
                      {isMasked ? record.maskedEngineNumber : record.engineNumber}
                    </span>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Weights (Unladen/Gross)</span>
                    <span className="font-bold text-slate-950">{record.unladenWeight} / {record.grossWeight}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Compliance, Insurance & PUCC Validities */}
            {(activeSubTab === "all" || activeSubTab === "compliance") && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Statutory Validities &amp; Compliance Matrix
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-slate-200 bg-emerald-50/40 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">Fitness Validity</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-xs">
                        ACTIVE
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 mt-1">Upto {record.fitnessUpto}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">15-year statutory period from registration date</div>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">MV Road Tax</span>
                      <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded-xs">
                        PAID
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 mt-1">{record.taxUpto}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Valid across all national routes</div>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">Insurance Policy</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-xs">
                        {record.insuranceStatus}
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 mt-1 truncate">{record.insuranceCompany}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Policy: {record.insurancePolicyNumber} • Valid Upto {record.insuranceUpto}
                    </div>
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">PUCC (Pollution)</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-xs">
                        {record.puccStatus}
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 mt-1">Cert: {record.puccNumber}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Valid Upto {record.puccUpto}</div>
                  </div>

                  <div className="sm:col-span-2 rounded border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">FASTag Electronic Toll ID</span>
                      <span className="font-bold text-slate-900 font-mono">{record.fastagId} ({record.fastagBank})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">E-Challan / Blacklist</span>
                      <span className="font-bold text-emerald-700">{record.blacklistStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Footer Note */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-600 font-sans gap-2">
              <div>
                Digital Verification Hash: <span className="font-mono font-bold text-slate-900">{record.digitalVerificationKey}</span>
              </div>
              <div className="text-slate-500">
                MoRTH VAHAN 4.0 API • Form 23 Electronic Extract
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center font-mono">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                  Querying Live Parivahan / VAHAN Registry for {plateNumber}...
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">No registry record loaded for &ldquo;{plateNumber}&rdquo;.</p>
                <p className="text-[11px] text-slate-500">Please enter a valid plate or query through the VAHAN modal.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </TiltCard3D>
  );
}
