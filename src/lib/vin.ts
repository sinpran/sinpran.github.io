/**
 * VIN decoding, ISO 3779 / FMVSS 565.
 *
 * Everything here runs offline. The Vehicle Tracker app calls NHTSA's vPIC API
 * for the attributes that drive its maintenance rules (fuel type, drive type),
 * but the structure of a VIN — validity, model year, origin — is fully
 * determined by the seventeen characters themselves.
 */

export type VinErrorCode = "length" | "charset" | "checkDigit";

export interface VinDecoding {
  input: string;
  valid: boolean;
  errors: VinErrorCode[];
  wmi: string;
  vds: string;
  checkDigit: string;
  yearCode: string;
  plantCode: string;
  serial: string;
  modelYear: number | null;
  country: string | null;
  manufacturer: string | null;
  /** What the ninth character should be, given the other sixteen. */
  expectedCheckDigit: string | null;
}

/* I, O and Q are barred so they cannot be misread as 1 and 0. */
const TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

const VALID_CHARS = /^[A-HJ-NPR-Z0-9]{17}$/;

/* Position 10. The cycle repeats every thirty years; position 7 disambiguates. */
const YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";

/**
 * First character. Ranges rather than exact characters, because the standard
 * allocates blocks by region.
 */
const COUNTRIES: Array<[RegExp, string]> = [
  [/[1459]/, "United States"],
  [/2/, "Canada"],
  [/3/, "Mexico"],
  [/[68]/, "Australia / Argentina"],
  [/9/, "Brazil"],
  [/J/, "Japan"],
  [/K/, "South Korea"],
  [/L/, "China"],
  [/M/, "India"],
  [/N/, "Turkey"],
  [/P/, "Malaysia"],
  [/R/, "Taiwan"],
  [/S/, "United Kingdom"],
  [/T/, "Switzerland / Czechia"],
  [/U/, "Romania / Slovakia"],
  [/V/, "France / Spain / Austria"],
  [/W/, "Germany"],
  [/X/, "Russia"],
  [/Y/, "Sweden / Finland / Belgium"],
  [/Z/, "Italy"],
];

/**
 * World Manufacturer Identifier, first three characters. Deliberately partial:
 * the full registry is thousands of entries, so this covers what someone is
 * plausibly holding a VIN for, and anything else resolves to null rather than a
 * guess.
 */
const MANUFACTURERS: Record<string, string> = {
  "1FA": "Ford",
  "1FB": "Ford",
  "1FC": "Ford",
  "1FD": "Ford",
  "1FM": "Ford",
  "1FT": "Ford",
  "2FA": "Ford",
  "3FA": "Ford",
  WF0: "Ford",
  "1G1": "Chevrolet",
  "1GC": "Chevrolet",
  "1GN": "Chevrolet",
  "2G1": "Chevrolet",
  "3GC": "Chevrolet",
  KL1: "Chevrolet",
  "1GY": "Cadillac",
  "1G6": "Cadillac",
  "1GK": "GMC",
  "1GT": "GMC",
  "1HG": "Honda",
  "2HG": "Honda",
  "2HK": "Honda",
  "5FN": "Honda",
  JHM: "Honda",
  SHH: "Honda",
  "19X": "Honda",
  "19U": "Acura",
  JH4: "Acura",
  JT2: "Toyota",
  JTD: "Toyota",
  JTE: "Toyota",
  JTM: "Toyota",
  "4T1": "Toyota",
  "4T3": "Toyota",
  "5TD": "Toyota",
  "5TF": "Toyota",
  "2T1": "Toyota",
  JTH: "Lexus",
  "58A": "Lexus",
  "1N4": "Nissan",
  "1N6": "Nissan",
  JN1: "Nissan",
  JN8: "Nissan",
  "3N1": "Nissan",
  "5N1": "Nissan",
  JNK: "Infiniti",
  JM1: "Mazda",
  JM3: "Mazda",
  "4F2": "Mazda",
  "3MZ": "Mazda",
  JF1: "Subaru",
  JF2: "Subaru",
  "4S3": "Subaru",
  "4S4": "Subaru",
  JA3: "Mitsubishi",
  JA4: "Mitsubishi",
  "4A3": "Mitsubishi",
  KMH: "Hyundai",
  KM8: "Hyundai",
  "5NP": "Hyundai",
  KNA: "Kia",
  KND: "Kia",
  "5XY": "Kia",
  "3KP": "Kia",
  WBA: "BMW",
  WBS: "BMW",
  WBY: "BMW",
  "4US": "BMW",
  "5UX": "BMW",
  WDD: "Mercedes-Benz",
  WDB: "Mercedes-Benz",
  WDC: "Mercedes-Benz",
  W1K: "Mercedes-Benz",
  W1N: "Mercedes-Benz",
  "4JG": "Mercedes-Benz",
  WVW: "Volkswagen",
  WV1: "Volkswagen",
  WV2: "Volkswagen",
  "3VW": "Volkswagen",
  "1VW": "Volkswagen",
  WAU: "Audi",
  WA1: "Audi",
  TRU: "Audi",
  WP0: "Porsche",
  WP1: "Porsche",
  "5YJ": "Tesla",
  "7SA": "Tesla",
  "7G2": "Tesla",
  LRW: "Tesla",
  XP7: "Tesla",
  YV1: "Volvo",
  YV4: "Volvo",
  LYV: "Volvo",
  SAL: "Land Rover",
  SAJ: "Jaguar",
  ZFA: "Fiat",
  ZAR: "Alfa Romeo",
  ZAM: "Maserati",
  ZFF: "Ferrari",
  "1C3": "Chrysler",
  "1C4": "Chrysler",
  "2C3": "Chrysler",
  "3C4": "Chrysler",
  "1J4": "Jeep",
  "1J8": "Jeep",
  "1C6": "Ram",
  "5LM": "Lincoln",
  "1LN": "Lincoln",
  KL4: "Buick",
  "1G4": "Buick",
  "3N6": "Nissan",
  MAJ: "Ford India",
};

const normalise = (vin: string) => vin.trim().toUpperCase();

/**
 * The ninth character, derived from the other sixteen. A weighted sum mod 11,
 * where a remainder of 10 is written as "X".
 */
export function vinCheckDigit(vin: string): string | null {
  const value = normalise(vin);
  if (value.length !== 17) return null;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const digit = TRANSLITERATION[value[i]];
    // Position 9 is the check digit itself; its weight is 0, so an unknown
    // character there cannot invalidate the computation.
    if (digit === undefined) {
      if (i === 8) continue;
      return null;
    }
    sum += digit * WEIGHTS[i];
  }

  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export function isValidVin(vin: string): boolean {
  return decodeVin(vin).valid;
}

/**
 * Model year from position 10, disambiguated by position 7.
 *
 * The thirty codes repeat, so 'A' is both 1980 and 2010. The convention for
 * light vehicles is that position 7 is numeric for model years up to 2009 and
 * alphabetic from 2010, which is enough to pick a cycle.
 */
function modelYearFrom(yearCode: string, positionSeven: string): number | null {
  const index = YEAR_CODES.indexOf(yearCode);
  if (index === -1) return null;

  const secondCycle = /[A-Z]/.test(positionSeven);
  return 1980 + index + (secondCycle ? 30 : 0);
}

export function decodeVin(vin: string): VinDecoding {
  const value = normalise(vin);
  const errors: VinErrorCode[] = [];

  if (value.length !== 17) errors.push("length");
  // Only a charset complaint if the length is right; otherwise it is noise.
  else if (!VALID_CHARS.test(value)) errors.push("charset");

  const expectedCheckDigit = errors.length === 0 ? vinCheckDigit(value) : null;
  if (expectedCheckDigit !== null && expectedCheckDigit !== value[8]) {
    errors.push("checkDigit");
  }

  const yearCode = value[9] ?? "";
  const positionSeven = value[6] ?? "";

  return {
    input: value,
    valid: errors.length === 0,
    errors,
    // Sections are reported even for an invalid VIN: a typo should narrow the
    // readout, not blank it.
    wmi: value.slice(0, 3),
    vds: value.slice(3, 8),
    checkDigit: value[8] ?? "",
    yearCode,
    plantCode: value[10] ?? "",
    serial: value.slice(11, 17),
    modelYear: modelYearFrom(yearCode, positionSeven),
    country:
      COUNTRIES.find(([pattern]) => pattern.test(value[0] ?? ""))?.[1] ?? null,
    manufacturer: MANUFACTURERS[value.slice(0, 3)] ?? null,
    expectedCheckDigit,
  };
}
