import { describe, expect, it } from "vitest";
import {
  filterCatalogue,
  type VehicleAttributes,
} from "../src/lib/maintenance";

const attrs = (over: Partial<VehicleAttributes> = {}): VehicleAttributes => ({
  fuelType: null,
  driveType: null,
  ...over,
});

const names = (items: { name: string }[]) => items.map((i) => i.name);

describe("powertrain filtering", () => {
  it("hides combustion-only service from an electric vehicle", () => {
    const { applicable, excluded } = filterCatalogue(
      attrs({ fuelType: "electric" }),
    );

    expect(names(applicable)).not.toContain("Engine oil and filter");
    expect(names(applicable)).not.toContain("Spark plugs");
    expect(names(applicable)).not.toContain("Timing belt");
    expect(names(excluded)).toContain("Spark plugs");
  });

  it("explains why each excluded item was dropped", () => {
    const { excluded } = filterCatalogue(attrs({ fuelType: "electric" }));
    for (const item of excluded) {
      expect(item.reason.length, item.name).toBeGreaterThan(0);
    }
  });

  it("keeps spark plugs on a petrol car but not a diesel", () => {
    expect(
      names(filterCatalogue(attrs({ fuelType: "gasoline" })).applicable),
    ).toContain("Spark plugs");
    expect(
      names(filterCatalogue(attrs({ fuelType: "diesel" })).applicable),
    ).not.toContain("Spark plugs");
  });

  it("only asks a diesel for exhaust fluid", () => {
    expect(
      names(filterCatalogue(attrs({ fuelType: "diesel" })).applicable),
    ).toContain("Diesel exhaust fluid");
    expect(
      names(filterCatalogue(attrs({ fuelType: "gasoline" })).applicable),
    ).not.toContain("Diesel exhaust fluid");
  });
});

describe("driveline filtering", () => {
  it("hides differential service from a front-wheel-drive car", () => {
    const { applicable } = filterCatalogue(attrs({ driveType: "fwd" }));
    expect(names(applicable)).not.toContain("Differential fluid");
    expect(names(applicable)).not.toContain("Transfer case fluid");
  });

  it("keeps differential service on rear- and all-wheel drive", () => {
    for (const driveType of ["rwd", "awd", "4wd"] as const) {
      expect(
        names(filterCatalogue(attrs({ driveType })).applicable),
        driveType,
      ).toContain("Differential fluid");
    }
  });

  it("only asks four- and all-wheel drive for transfer case fluid", () => {
    expect(
      names(filterCatalogue(attrs({ driveType: "4wd" })).applicable),
    ).toContain("Transfer case fluid");
    expect(
      names(filterCatalogue(attrs({ driveType: "rwd" })).applicable),
    ).not.toContain("Transfer case fluid");
  });
});

describe("universal items", () => {
  it("services brakes, cabin air and tyres on everything", () => {
    for (const fuelType of [
      "gasoline",
      "diesel",
      "electric",
      "hybrid",
    ] as const) {
      const { applicable } = filterCatalogue(attrs({ fuelType }));
      expect(names(applicable), fuelType).toContain("Brake fluid");
      expect(names(applicable), fuelType).toContain("Cabin air filter");
      expect(names(applicable), fuelType).toContain("Tyre rotation");
    }
  });
});

describe("unknown attributes", () => {
  it("keeps an item when it cannot be ruled out", () => {
    // Hiding service because the decode was incomplete is the dangerous
    // failure direction; an unknown powertrain keeps everything it might need.
    const { applicable, excluded } = filterCatalogue(attrs());
    expect(names(applicable)).toContain("Engine oil and filter");
    expect(names(applicable)).toContain("Differential fluid");
    // Items gated on a positive match still stay out until confirmed.
    expect(names(excluded)).toContain("Diesel exhaust fluid");
  });
});

describe("catalogue shape", () => {
  it("gives every item a name and an interval, and never loses one", () => {
    const { applicable, excluded } = filterCatalogue(
      attrs({ fuelType: "electric", driveType: "fwd" }),
    );
    const all = [...applicable, ...excluded];

    expect(all.length).toBeGreaterThanOrEqual(10);
    expect(new Set(names(all)).size).toBe(all.length);
    for (const item of applicable) {
      expect(item.interval.length, item.name).toBeGreaterThan(0);
    }
  });

  it("an electric front-driver ends up with a visibly shorter list", () => {
    const ev = filterCatalogue(
      attrs({ fuelType: "electric", driveType: "fwd" }),
    );
    const truck = filterCatalogue(
      attrs({ fuelType: "diesel", driveType: "4wd" }),
    );
    expect(ev.applicable.length).toBeLessThan(truck.applicable.length);
  });
});
