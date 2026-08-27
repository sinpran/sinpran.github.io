/**
 * The applicability filter from Vehicle Tracker, reduced to the part that can
 * run in a browser.
 *
 * A generic maintenance list is close to useless because most of it does not
 * apply to your car, and the items that do get buried. So each item declares
 * what it needs from the vehicle, and anything the vehicle does not have is
 * dropped with a reason rather than silently hidden.
 *
 * Intervals are widely-used engineering-standard rules, not a licensed per-trim
 * OEM schedule.
 */

export type FuelType = "gasoline" | "diesel" | "electric" | "hybrid";
export type DriveType = "fwd" | "rwd" | "awd" | "4wd";

export interface VehicleAttributes {
  fuelType: FuelType | null;
  driveType: DriveType | null;
}

export interface CatalogueItem {
  name: string;
  interval: string;
}

export interface ExcludedItem extends CatalogueItem {
  reason: string;
}

interface Rule extends CatalogueItem {
  /**
   * Returns why the item does not apply, or null when it does.
   *
   * An unknown attribute must not exclude an item: dropping service because the
   * decode came back thin is the dangerous direction to fail in. Items that are
   * only relevant to a specific powertrain gate on a positive match instead.
   */
  excludedBecause(vehicle: VehicleAttributes): string | null;
}

const burnsFuel = (fuel: FuelType | null) => fuel !== "electric";

const CATALOGUE: Rule[] = [
  {
    name: "Engine oil and filter",
    interval: "5,000–7,500 mi",
    excludedBecause: ({ fuelType }) =>
      burnsFuel(fuelType) ? null : "an electric powertrain has no engine oil",
  },
  {
    name: "Spark plugs",
    interval: "60,000–100,000 mi",
    excludedBecause: ({ fuelType }) => {
      if (fuelType === "electric")
        return "an electric powertrain has no spark plugs";
      if (fuelType === "diesel")
        return "diesel is compression-ignition, so there are no plugs";
      return null;
    },
  },
  {
    name: "Engine air filter",
    interval: "30,000 mi",
    excludedBecause: ({ fuelType }) =>
      burnsFuel(fuelType) ? null : "nothing is drawing intake air",
  },
  {
    name: "Timing belt",
    interval: "90,000–105,000 mi",
    excludedBecause: ({ fuelType }) =>
      burnsFuel(fuelType)
        ? null
        : "an electric motor has no valvetrain to time",
  },
  {
    name: "Diesel exhaust fluid",
    interval: "10,000 mi",
    excludedBecause: ({ fuelType }) =>
      fuelType === "diesel" ? null : "only diesel aftertreatment consumes DEF",
  },
  {
    name: "Transmission fluid",
    interval: "60,000 mi",
    excludedBecause: ({ fuelType }) =>
      fuelType === "electric"
        ? "a single-speed reduction gear is sealed for life"
        : null,
  },
  {
    name: "Differential fluid",
    interval: "50,000 mi",
    excludedBecause: ({ driveType }) =>
      driveType === "fwd"
        ? "front-wheel drive integrates the differential into the transaxle"
        : null,
  },
  {
    name: "Transfer case fluid",
    interval: "60,000 mi",
    excludedBecause: ({ driveType }) =>
      driveType === "4wd" || driveType === "awd"
        ? null
        : "only four- and all-wheel drive have a transfer case",
  },
  {
    name: "Coolant",
    interval: "100,000 mi",
    excludedBecause: () => null,
  },
  {
    name: "Brake fluid",
    interval: "3 years",
    excludedBecause: () => null,
  },
  {
    name: "Brake pads and rotors",
    interval: "inspect at 20,000 mi",
    excludedBecause: () => null,
  },
  {
    name: "Cabin air filter",
    interval: "20,000 mi",
    excludedBecause: () => null,
  },
  {
    name: "Tyre rotation",
    interval: "7,500 mi",
    excludedBecause: () => null,
  },
  {
    name: "12V battery",
    interval: "4–5 years",
    excludedBecause: () => null,
  },
];

export function filterCatalogue(vehicle: VehicleAttributes): {
  applicable: CatalogueItem[];
  excluded: ExcludedItem[];
} {
  const applicable: CatalogueItem[] = [];
  const excluded: ExcludedItem[] = [];

  for (const { name, interval, excludedBecause } of CATALOGUE) {
    const reason = excludedBecause(vehicle);
    if (reason === null) applicable.push({ name, interval });
    else excluded.push({ name, interval, reason });
  }

  return { applicable, excluded };
}

/** Maps NHTSA vPIC's free-text fields onto the attributes the filter needs. */
export function attributesFromVpic(
  record: Record<string, unknown>,
): VehicleAttributes {
  const text = (key: string) => String(record[key] ?? "").toLowerCase();

  const fuel = `${text("FuelTypePrimary")} ${text("ElectrificationLevel")}`;
  const drive = text("DriveType");

  let fuelType: FuelType | null = null;
  if (/electric/.test(fuel) && !/hybrid/.test(fuel)) fuelType = "electric";
  else if (/hybrid/.test(fuel)) fuelType = "hybrid";
  else if (/diesel/.test(fuel)) fuelType = "diesel";
  else if (/gasoline|petrol|flexible/.test(fuel)) fuelType = "gasoline";

  let driveType: DriveType | null = null;
  if (/4wd|4x4|four/.test(drive)) driveType = "4wd";
  else if (/awd|all-wheel|all wheel/.test(drive)) driveType = "awd";
  else if (/rwd|rear/.test(drive)) driveType = "rwd";
  else if (/fwd|front/.test(drive)) driveType = "fwd";

  return { fuelType, driveType };
}
