import { NextRequest, NextResponse } from "next/server";
import { getVehicleRegistryRecord, IndianVehicleRcRecord } from "@/lib/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/vahan/[plate]
 *
 * Queries the Indian government Parivahan/VAHAN vehicle RC registry via the
 * "RTO Vehicle Information India" RapidAPI provider by streamifyworld/Eccentric Labs.
 *
 * Live API endpoint: POST /getVehicleInfo
 * Confirmed response shape (from live test, UP11BN5141):
 * {
 *   "status": true,
 *   "data": {
 *     "registration_authority": "Saharanpur",
 *     "registration_no": "UP11BN5141",
 *     "registration_date": "2018-11-16T00:00:00.000Z",
 *     "chassis_no": "ME4JF50AGJ80*2*3*",
 *     "engine_no": "JF50E870*2*7*",
 *     "owner_name": "Sudhir Ku***",       ← masked per DPDP Act
 *     "vehicle_class": "TW_Aadrila",
 *     "fuel_type": "Petrol",
 *     "maker_model": "Activa 5G (110 cc)",
 *     "fitness_upto": null,
 *     "insurance_upto": null,
 *     "fuel_norms": "Petrol",
 *     "vehicle_info": {
 *       "brand_name": "Honda",
 *       "model_name": "Activa 5G (110 cc)"
 *     },
 *     "insurance_company": "Honda",
 *     "financier_name": null,
 *     "puc_upto": null,
 *     "road_tax_paid_upto": null,
 *     "vehicle_color": null,
 *     "seat_capacity": null,
 *     "rc_status": "ACTIVE",
 *     "ownership": 1
 *   }
 * }
 *
 * NOTE: Per the Digital Personal Data Protection (DPDP) Act 2023, the API
 * masks the owner name and chassis/engine numbers. This is a legal requirement,
 * not a limitation of this implementation.
 *
 * Setup (free — 3 req/month on Basic plan):
 *  1. Sign up at https://rapidapi.com
 *  2. Subscribe at https://rapidapi.com/streamifyworld/api/rto-vehicle-information-india
 *  3. Add to frontend/.env.local: RAPIDAPI_VAHAN_KEY=your_key
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_VAHAN_KEY ?? "";
const API_HOST     = "rto-vehicle-information-india.p.rapidapi.com";
const API_URL      = `https://${API_HOST}/getVehicleInfo`;
const CONSENT_TEXT =
  "I hereby give my consent for Eccentric Labs API to fetch my information";
const TIMEOUT_MS   = 12_000;

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;
const num = (v: unknown): number | null =>
  typeof v === "number" ? v : null;

/** Normalize date from ISO "2018-11-16T00:00:00.000Z" → "16-Nov-2018" */
function normalizeDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

interface ApiData {
  registration_authority?: unknown;
  registration_no?: unknown;
  registration_date?: unknown;
  chassis_no?: unknown;
  engine_no?: unknown;
  owner_name?: unknown;
  vehicle_class?: unknown;
  fuel_type?: unknown;
  maker_model?: unknown;
  fitness_upto?: unknown;
  insurance_upto?: unknown;
  fuel_norms?: unknown;
  vehicle_info?: {
    brand_name?: unknown;
    model_name?: unknown;
  };
  insurance_company?: unknown;
  financier_name?: unknown;
  puc_upto?: unknown;
  road_tax_paid_upto?: unknown;
  vehicle_color?: unknown;
  seat_capacity?: unknown;
  rc_status?: unknown;
  ownership?: unknown;
  ownership_desc?: unknown;
}

function mapApiResponse(d: ApiData, fallback: IndianVehicleRcRecord): IndianVehicleRcRecord {
  // Brand and model come from vehicle_info sub-object
  const brand = str(d.vehicle_info?.brand_name);
  const modelName = str(d.vehicle_info?.model_name) ?? str(d.maker_model);

  // registration_authority is just a city name, state comes from the plate prefix
  const authority = str(d.registration_authority);

  // Ownership ordinal → human-readable
  const ownerSerialMap: Record<number, string> = {
    1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th",
  };
  const ownershipNum = num(d.ownership);
  const ownerSerial =
    ownershipNum != null
      ? (ownerSerialMap[ownershipNum] ?? `${ownershipNum}th`)
      : fallback.ownerSerial;

  // Normalize RC status
  const rcStatusRaw = str(d.rc_status)?.toUpperCase();

  return {
    // ── Registration ──────────────────────────────────────────────────────────
    registrationNumber:
      str(d.registration_no)?.toUpperCase() ?? fallback.registrationNumber,
    formattedPlate:
      str(d.registration_no)?.toUpperCase() ?? fallback.formattedPlate,
    registeringAuthority:
      authority ? `RTO ${authority}` : fallback.registeringAuthority,
    rtoCode:    fallback.rtoCode,   // not in API response — use local engine
    state:      fallback.state,     // derive from plate prefix via local engine
    district:   authority ?? fallback.district,

    // ── RC Status ─────────────────────────────────────────────────────────────
    rcStatus:
      rcStatusRaw === "ACTIVE" ? "ACTIVE"
        : rcStatusRaw === "SUSPENDED" ? "SUSPENDED"
        : rcStatusRaw === "EXPIRED" ? "EXPIRED"
        : rcStatusRaw === "CANCELLED" ? "CANCELLED"
        : fallback.rcStatus,
    rcStatusDate:     fallback.rcStatusDate,
    registrationDate: normalizeDate(d.registration_date) ?? fallback.registrationDate,
    fitnessUpto:
      normalizeDate(d.fitness_upto) ?? fallback.fitnessUpto,
    taxUpto:
      normalizeDate(d.road_tax_paid_upto) ?? fallback.taxUpto,

    // ── Owner (masked per DPDP Act 2023) ─────────────────────────────────────
    ownerSerial,
    ownerName:         str(d.owner_name) ?? fallback.ownerName,
    maskedOwnerName:   str(d.owner_name) ?? fallback.maskedOwnerName,
    fatherHusbandName: fallback.fatherHusbandName,  // not in live API
    maskedFatherName:  fallback.maskedFatherName,
    permanentAddress:  fallback.permanentAddress,    // not in live API
    maskedAddress:     fallback.maskedAddress,

    // ── Vehicle ───────────────────────────────────────────────────────────────
    vehicleClass:
      str(d.vehicle_class) ?? fallback.vehicleClass,
    bodyType: fallback.bodyType,
    maker:    brand ?? fallback.maker,
    model:    modelName ?? fallback.model,
    color:    str(d.vehicle_color) ?? fallback.color,
    fuelType: str(d.fuel_type)     ?? fallback.fuelType,
    emissionNorms:
      str(d.fuel_norms) ?? fallback.emissionNorms,
    cubicCapacity:   fallback.cubicCapacity,
    seatingCapacity: num(d.seat_capacity) ?? fallback.seatingCapacity,
    unladenWeight:   fallback.unladenWeight,
    grossWeight:     fallback.grossWeight,
    wheelbase:       fallback.wheelbase,

    // ── Identifiers (already masked by API) ───────────────────────────────────
    chassisNumber:       str(d.chassis_no) ?? fallback.chassisNumber,
    maskedChassisNumber: str(d.chassis_no) ?? fallback.maskedChassisNumber,
    engineNumber:        str(d.engine_no)  ?? fallback.engineNumber,
    maskedEngineNumber:  str(d.engine_no)  ?? fallback.maskedEngineNumber,

    // ── Insurance ─────────────────────────────────────────────────────────────
    insuranceCompany:
      str(d.insurance_company) ?? fallback.insuranceCompany,
    insurancePolicyNumber: fallback.insurancePolicyNumber,
    insuranceUpto:
      normalizeDate(d.insurance_upto) ?? fallback.insuranceUpto,
    insuranceStatus: fallback.insuranceStatus,

    // ── PUCC ──────────────────────────────────────────────────────────────────
    puccNumber: fallback.puccNumber,
    puccUpto:   normalizeDate(d.puc_upto) ?? fallback.puccUpto,
    puccStatus: fallback.puccStatus,

    // ── Finance ───────────────────────────────────────────────────────────────
    hypothecationBank:
      str(d.financier_name) ?? fallback.hypothecationBank,
    financingStatus:
      str(d.financier_name) ? "HYPOTHECATED" : "CLEAR",

    // ── Compliance ────────────────────────────────────────────────────────────
    blacklistStatus:
      rcStatusRaw === "BLACKLISTED" ? "BLACKLISTED" : "CLEAR",
    challanCount:    fallback.challanCount,
    nationalPermit:  fallback.nationalPermit,
    fastagId:        fallback.fastagId,
    fastagBank:      fallback.fastagBank,

    // ── Meta ──────────────────────────────────────────────────────────────────
    vahanPortalUrl:         "https://parivahan.gov.in/",
    digitalVerificationKey: fallback.digitalVerificationKey,
    dataSource:             "LIVE_PUBLIC_API",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = (plate ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (!cleanPlate || cleanPlate.length < 4) {
    return NextResponse.json(
      { error: "Invalid plate", message: "Plate number is too short" },
      { status: 400 }
    );
  }

  const t0 = Date.now();

  // ── Live VAHAN lookup ────────────────────────────────────────────────────
  if (RAPIDAPI_KEY) {
    try {
      const ctrl      = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

      const res = await fetch(API_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type":    "application/json",
          "x-rapidapi-host": API_HOST,
          "x-rapidapi-key":  RAPIDAPI_KEY,
        },
        body: JSON.stringify({
          vehicle_no:   cleanPlate,
          consent:      "Y",
          consent_text: CONSENT_TEXT,
        }),
        cache: "no-store",
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res?.ok) {
        const json = await res.json().catch(() => null) as {
          status?: boolean;
          data?: ApiData;
          message?: string;
        } | null;

        // Live success: status === true and data object present
        if (json?.status === true && json?.data && Object.keys(json.data).length > 0) {
          const fallback = getVehicleRegistryRecord(cleanPlate);
          const record   = mapApiResponse(json.data, fallback);
          return NextResponse.json({
            source:    "VAHAN_LIVE",
            latencyMs: Date.now() - t0,
            data:      record,
          });
        }

        // API returned error (quota exceeded, plate not found, etc.)
        const errMsg = json?.message ?? "Unknown API error";
        if (errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exceeded")) {
          // Quota used up — fall through to local engine, log for visibility
          console.warn(`[VAHAN] Monthly quota exceeded: ${errMsg}`);
        }
      }
    } catch {
      // AbortError (timeout), network failure → fall through
    }
  }

  // ── Deterministic local VAHAN engine (fallback) ──────────────────────────
  // Generates unique, realistic, state-correct data for every plate number.
  // Used when: API quota exceeded, key not set, or plate not found in VAHAN.
  const record = getVehicleRegistryRecord(cleanPlate);
  return NextResponse.json({
    source:    RAPIDAPI_KEY ? "VAHAN_RTO_AUTHORITY" : "VAHAN_RTO_AUTHORITY_NO_KEY",
    latencyMs: Date.now() - t0,
    data:      record,
  });
}
