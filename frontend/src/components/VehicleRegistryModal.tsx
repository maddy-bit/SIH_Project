"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getVehicleRegistryRecord, type IndianVehicleRcRecord } from "@/lib/registry";
import { generateRcPdf } from "@/lib/generateRcPdf";

interface VehicleRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlate?: string;
}

export function VehicleRegistryModal({
  isOpen,
  onClose,
  initialPlate = "MH12AB1234",
}: VehicleRegistryModalProps) {
  const [queryPlate, setQueryPlate] = useState(initialPlate);
  const [activePlate, setActivePlate] = useState(initialPlate);
  const [isMasked, setIsMasked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "technical" | "compliance">("overview");

  const record: IndianVehicleRcRecord = getVehicleRegistryRecord(activePlate);

  const handleSearchPlate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryPlate.trim()) return;
    setActivePlate(queryPlate.trim().toUpperCase());
  };

  const handleDownloadPdf = () => {
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
                    placeholder="Enter Indian Regn Number e.g. MH12AB1234"
                    className="w-full rounded-md border-2 border-slate-400 bg-white p-2.5 text-sm font-bold text-slate-950 uppercase tracking-widest focus:outline-none focus:border-slate-900 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">🇮🇳 VAHAN</span>
                </div>
                <button
                  type="submit"
                  className="neo-btn px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  🔍 Query VAHAN
                </button>
              </form>
            </div>

            {/* Active Record Display */}
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
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[340px]">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-slate-300 bg-white p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Registering Authority (RTO)</span>
                    <span className="font-bold text-slate-950 text-sm block">{record.registeringAuthority}</span>
                    <span className="text-[10px] text-slate-600 block">RTO Code: {record.rtoCode} • State: {record.state}</span>
                  </div>

                  <div className="rounded border border-slate-300 bg-white p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Registered Owner</span>
                      <button
                        type="button"
                        onClick={() => setIsMasked(!isMasked)}
                        className="text-[9px] text-sky-700 hover:text-sky-900 font-bold cursor-pointer underline"
                      >
                        {isMasked ? "Show Full" : "Mask"}
                      </button>
                    </div>
                    <span className="font-bold text-slate-950 text-sm block">
                      {isMasked ? record.maskedOwnerName : record.ownerName}
                    </span>
                    <span className="text-[10px] text-slate-600 block">
                      Father/Husband: {isMasked ? record.maskedFatherName : record.fatherHusbandName}
                    </span>
                  </div>

                  <div className="rounded border border-slate-300 bg-white p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Registration Date &amp; Status</span>
                    <span className="font-bold text-slate-950 block">{record.registrationDate} (ACTIVE)</span>
                    <span className="text-[10px] text-slate-600 block">Status Certified on {record.rcStatusDate}</span>
                  </div>

                  <div className="rounded border border-slate-300 bg-white p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Hypothecation (Bank Lien)</span>
                    <span className="font-bold text-slate-950 block">{record.hypothecationBank ?? "None (Owned Clear)"}</span>
                    <span className="text-[10px] text-emerald-700 font-bold block">Status: {record.financingStatus}</span>
                  </div>

                  <div className="sm:col-span-2 rounded border border-slate-300 bg-white p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered Address</span>
                    <span className="font-medium text-slate-900 block font-sans">
                      {isMasked ? record.maskedAddress : record.permanentAddress}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: Technical Specs */}
              {activeTab === "technical" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Maker</span>
                    <span className="font-bold text-slate-950 block">{record.maker}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Model Name</span>
                    <span className="font-bold text-slate-950 block">{record.model}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Vehicle Class</span>
                    <span className="font-bold text-slate-950 block">{record.vehicleClass}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Fuel Type</span>
                    <span className="font-bold text-slate-950 block">{record.fuelType}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Emission Standard</span>
                    <span className="font-bold text-emerald-700 block">{record.emissionNorms}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Displacement (cc)</span>
                    <span className="font-bold text-slate-950 block">{record.cubicCapacity}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Chassis Number</span>
                    <span className="font-bold text-slate-950 block font-mono">
                      {isMasked ? record.maskedChassisNumber : record.chassisNumber}
                    </span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Engine Number</span>
                    <span className="font-bold text-slate-950 block font-mono">
                      {isMasked ? record.maskedEngineNumber : record.engineNumber}
                    </span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Seating Capacity</span>
                    <span className="font-bold text-slate-950 block">{record.seatingCapacity} Persons</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Unladen / Gross Weight</span>
                    <span className="font-bold text-slate-950 block">{record.unladenWeight} / {record.grossWeight}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Wheelbase</span>
                    <span className="font-bold text-slate-950 block">{record.wheelbase}</span>
                  </div>
                  <div className="rounded border border-slate-300 bg-white p-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered Color</span>
                    <span className="font-bold text-slate-950 block">{record.color}</span>
                  </div>
                </div>
              )}

              {/* TAB 3: Statutory Compliance */}
              {activeTab === "compliance" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-slate-300 bg-emerald-50/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">Fitness Validity</span>
                      <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-xs">
                        ACTIVE
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 text-sm mt-1">Upto {record.fitnessUpto}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">15-year statutory period from registration date</div>
                  </div>

                  <div className="rounded border border-slate-300 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">Motor Vehicle Tax</span>
                      <span className="text-[9px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded-xs">
                        PAID
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 text-sm mt-1">{record.taxUpto}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">One-time Life Time Tax paid at RTO</div>
                  </div>

                  <div className="rounded border border-slate-300 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">Insurance Validity</span>
                      <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-xs">
                        {record.insuranceStatus}
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 text-sm mt-1 truncate">{record.insuranceCompany}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Policy: {record.insurancePolicyNumber} • Valid Upto {record.insuranceUpto}
                    </div>
                  </div>

                  <div className="rounded border border-slate-300 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">PUCC (Pollution) Certificate</span>
                      <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-xs">
                        {record.puccStatus}
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 text-sm mt-1">Certificate: {record.puccNumber}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Valid Upto {record.puccUpto}</div>
                  </div>

                  <div className="sm:col-span-2 rounded border border-slate-300 bg-slate-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Electronic Toll (FASTag ID)</span>
                      <span className="font-bold text-slate-950 font-mono">{record.fastagId} ({record.fastagBank})</span>
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
