"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchVehicleRegistryRecord, type IndianVehicleRcRecord } from "@/lib/registry";
import { generateRcPdf } from "@/lib/generateRcPdf";

interface VehicleRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlate?: string;
}

export function VehicleRegistryModal({
  isOpen,
  onClose,
  initialPlate = "ET3633P",
}: VehicleRegistryModalProps) {
  const [queryPlate, setQueryPlate] = useState(initialPlate);
  const [activePlate, setActivePlate] = useState(initialPlate);
  const [record, setRecord] = useState<IndianVehicleRcRecord | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "technical" | "compliance">("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setErrorInfo(null);
      setRecord(null);

      const res = await fetchVehicleRegistryRecord(activePlate);
      if (!cancelled) {
        if (res.success && res.data) {
          setRecord(res.data);
          setErrorInfo(null);
        } else {
          setRecord(null);
          setErrorInfo({
            code: res.error || "VEHICLE_NOT_FOUND",
            message: res.message || `No registration records found for plate ${activePlate}.`,
          });
        }
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activePlate]);

  const handleSearchPlate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryPlate.trim().toUpperCase();
    if (!clean) return;
    setActivePlate(clean);
  };

  const handleDownloadPdf = () => {
    if (!record) return;
    setIsDownloading(true);
    try {
      generateRcPdf(record);
    } catch (err) {
      console.error("Failed to generate RC PDF:", err);
    } finally {
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative w-full max-w-3xl border-2 border-slate-900 bg-white shadow-2xl rounded-xl max-h-[90vh] overflow-y-auto flex flex-col font-mono"
          >
            {/* Government Form 23 Header Strip */}
            <div className="border-b-2 border-slate-900 bg-slate-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white text-xl shadow-xs">
                  🏛️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Government of India • MoRTH
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-xs">
                      VAHAN 4.0 CENTRAL REGISTER
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                    FORM 23: Certificate of Vehicle Registration
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold uppercase text-slate-800 hover:bg-slate-200 shadow-xs transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Sub-Header: Plate Search Bar */}
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <form onSubmit={handleSearchPlate} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={queryPlate}
                    onChange={(e) => setQueryPlate(e.target.value.toUpperCase())}
                    placeholder="Enter Indian Regn Number e.g. UP11BN5141, DL01AB1234"
                    className="w-full rounded-md border-2 border-slate-400 bg-white p-2.5 text-sm font-bold text-slate-950 uppercase tracking-widest focus:outline-none focus:border-slate-900 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">🇮🇳 VAHAN</span>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="neo-btn px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider cursor-pointer whitespace-nowrap disabled:opacity-75"
                >
                  {isLoading ? "⚡ Fetching Live..." : "🔍 Query VAHAN"}
                </button>
              </form>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Querying Government VAHAN 4.0 Central Database...
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Plate: {activePlate} • Encrypted National RTO Gateway
                </p>
              </div>
            )}

            {/* Error State (Invalid plate, Not found, or Quota exceeded) */}
            {!isLoading && errorInfo && (
              <div className="p-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl border border-red-200">
                  {errorInfo.code === "INVALID_NUMBER_PLATE" ? "⚠️" : errorInfo.code === "API_QUOTA_EXCEEDED" ? "⏱️" : "🔍"}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-950 tracking-tight">
                    {errorInfo.code === "INVALID_NUMBER_PLATE"
                      ? "Invalid Registration Plate Number"
                      : errorInfo.code === "API_QUOTA_EXCEEDED"
                      ? "VAHAN API Request Limit Reached"
                      : "Vehicle Not Found in Registry"}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    {errorInfo.message}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-block rounded-xs bg-slate-100 px-3 py-1.5 text-xs font-mono text-slate-600 border border-slate-300">
                    Registration Number Queried: <strong className="text-slate-950 font-bold">{activePlate}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Active Record Display */}
            {!isLoading && record && (
              <>
                <div className="p-5 space-y-4 flex-1">
                  {/* Clean Status & Action Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span>STATUS: {record.rcStatus}</span>
                        <span className="text-slate-400">|</span>
                        <span>{record.ownerSerial}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-200 border border-slate-300 px-2 py-1 rounded-sm">
                        ⚡ LIVE PUBLIC API
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[300px]">
                        {record.registeringAuthority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                      >
                        <span>{isDownloading ? "⏳" : "📥"}</span>
                        <span>{isDownloading ? "Generating PDF…" : "Download Official RC (PDF)"}</span>
                      </button>

                      <a
                        href={record.vahanPortalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded border border-slate-300 transition-colors"
                      >
                        <span>parivahan.gov.in</span>
                        <span className="text-[9px]">↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex items-center gap-1.5 rounded-md bg-slate-100 p-1 border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className={`flex-1 py-1.5 px-3 rounded-xs font-bold transition-all cursor-pointer ${
                        activeTab === "overview" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Registration &amp; Ownership
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("technical")}
                      className={`flex-1 py-1.5 px-3 rounded-xs font-bold transition-all cursor-pointer ${
                        activeTab === "technical" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Technical &amp; Engine Specs
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("compliance")}
                      className={`flex-1 py-1.5 px-3 rounded-xs font-bold transition-all cursor-pointer ${
                        activeTab === "compliance" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Statutory Validities (Tax/PUC/Insurance)
                    </button>
                  </div>

                  {/* TAB 1: Registration & Ownership */}
                  {activeTab === "overview" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Registering Authority (RTO)</span>
                          <span className="font-black text-slate-900 text-sm block">{record.registeringAuthority}</span>
                          <span className="text-[11px] text-slate-600 block">RTO Code: {record.rtoCode} • State: {record.state}</span>
                        </div>
                        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered Owner</span>
                            <button
                              type="button"
                              onClick={() => setIsMasked(!isMasked)}
                              className="text-[10px] text-blue-600 underline font-bold cursor-pointer"
                            >
                              {isMasked ? "Unmask" : "Mask"}
                            </button>
                          </div>
                          <span className="font-black text-slate-900 text-sm block">
                            {isMasked ? record.maskedOwnerName : record.ownerName}
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            Father/Husband: {isMasked ? record.maskedFatherName : record.fatherHusbandName}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Registration Date &amp; Status</span>
                          <span className="font-bold text-slate-900">{record.registrationDate} ({record.rcStatus})</span>
                          <span className="text-[10px] text-slate-500 block">Status Certified on {record.rcStatusDate}</span>
                        </div>
                        <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Hypothecation (Bank Lien)</span>
                          <span className="font-bold text-slate-900">{record.hypothecationBank || "None (Unencumbered)"}</span>
                          <span className={`text-[10px] font-bold block ${record.financingStatus === "HYPOTHECATED" ? "text-amber-700" : "text-emerald-700"}`}>
                            Status: {record.financingStatus}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered Address</span>
                        <span className="font-medium text-slate-800">
                          {isMasked ? record.maskedAddress : record.permanentAddress}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Technical & Engine Specs */}
                  {activeTab === "technical" && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Maker (OEM)</span>
                          <span className="font-bold text-slate-900 text-[11px] block truncate">{record.maker}</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Model Variant</span>
                          <span className="font-bold text-slate-900 text-[11px] block truncate">{record.model}</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Vehicle Class</span>
                          <span className="font-bold text-slate-900 text-[11px] block truncate">{record.vehicleClass}</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Fuel / Norms</span>
                          <span className="font-bold text-slate-900 text-[11px] block truncate">{record.fuelType} • {record.emissionNorms}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Color</span>
                          <span className="font-bold text-slate-900">{record.color}</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Displacement</span>
                          <span className="font-bold text-slate-900">{record.cubicCapacity}</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Seating Cap.</span>
                          <span className="font-bold text-slate-900">{record.seatingCapacity} Persons</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Wheelbase</span>
                          <span className="font-bold text-slate-900">{record.wheelbase}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-3 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Chassis Number (VIN)</span>
                          <span className="font-mono font-bold text-slate-900">{record.maskedChassisNumber}</span>
                        </div>
                        <div className="p-3 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Engine Number</span>
                          <span className="font-mono font-bold text-slate-900">{record.maskedEngineNumber}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Statutory Validities */}
                  {activeTab === "compliance" && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="p-3 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Motor Insurance</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${record.insuranceStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {record.insuranceStatus}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 block mt-1">{record.insuranceCompany}</span>
                          <span className="text-[10px] text-slate-500 block">Valid Upto: {record.insuranceUpto}</span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5 truncate">Pol: {record.insurancePolicyNumber}</span>
                        </div>

                        <div className="p-3 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">PUC Certificate</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${record.puccStatus === "VALID" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {record.puccStatus}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 block mt-1">Emission Compliant</span>
                          <span className="text-[10px] text-slate-500 block">Valid Upto: {record.puccUpto}</span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5 truncate">PUCC: {record.puccNumber}</span>
                        </div>

                        <div className="p-3 rounded bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Road Tax &amp; Fitness</span>
                          <span className="font-bold text-slate-900 block mt-1">{record.taxUpto}</span>
                          <span className="text-[10px] text-slate-500 block">Fitness Upto: {record.fitnessUpto}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">National Electronic Toll (FASTag)</span>
                          <span className="font-bold text-slate-900">{record.fastagBank}</span>
                          <span className="text-[10px] font-mono text-slate-500 block">TAG ID: {record.fastagId}</span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Challans &amp; Blacklist Status</span>
                          <span className="font-bold text-emerald-700">{record.blacklistStatus}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-slate-200 bg-slate-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-600">
                  <div>
                    Digital Verification Hash: <span className="font-mono font-bold text-slate-900">{record.digitalVerificationKey}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-200 cursor-pointer text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Footer when no record is loaded */}
            {!isLoading && !record && (
              <div className="border-t border-slate-200 bg-slate-100 p-3.5 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
