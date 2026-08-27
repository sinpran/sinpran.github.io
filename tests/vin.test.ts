import { describe, expect, it } from "vitest";
import { decodeVin, isValidVin, vinCheckDigit } from "../src/lib/vin";

/*
 * Test vectors are published examples with independently known check digits:
 *  - 1HGCM82633A004352  NHTSA's own sample VIN (2003 Honda Accord)
 *  - 1M8GDM9AXKP042788  the standard worked example for an "X" check digit
 *  - 11111111111111111  degenerate case; every transliterated value is 1
 */
const HONDA = "1HGCM82633A004352";
const X_CHECK = "1M8GDM9AXKP042788";
const ALL_ONES = "11111111111111111";

describe("check digit", () => {
  it("computes the published check digits", () => {
    expect(vinCheckDigit(HONDA)).toBe("3");
    expect(vinCheckDigit(X_CHECK)).toBe("X");
    expect(vinCheckDigit(ALL_ONES)).toBe("1");
  });

  it("accepts VINs whose ninth character matches", () => {
    for (const vin of [HONDA, X_CHECK, ALL_ONES]) {
      expect(isValidVin(vin), vin).toBe(true);
    }
  });

  it("rejects a single transposed character", () => {
    // Swapping two characters almost always breaks the weighted sum, which is
    // the entire point of the check digit.
    const transposed = "1HGCM82633A004325";
    expect(isValidVin(transposed)).toBe(false);
  });

  it("is case insensitive", () => {
    expect(vinCheckDigit(HONDA.toLowerCase())).toBe("3");
    expect(isValidVin(HONDA.toLowerCase())).toBe(true);
  });
});

describe("structural validation", () => {
  it("requires exactly seventeen characters", () => {
    expect(decodeVin("1HGCM82633A00435").errors).toContain("length");
    expect(decodeVin(HONDA + "9").errors).toContain("length");
  });

  it("rejects I, O and Q, which are barred to avoid confusion with 1 and 0", () => {
    for (const letter of ["I", "O", "Q"]) {
      const vin = letter + HONDA.slice(1);
      expect(decodeVin(vin).errors, `${letter} should be rejected`).toContain(
        "charset",
      );
    }
  });

  it("reports a bad check digit separately from a bad charset", () => {
    const result = decodeVin("1HGCM82613A004352");
    expect(result.errors).toContain("checkDigit");
    expect(result.errors).not.toContain("charset");
  });

  it("still returns the parsed sections for an invalid VIN", () => {
    // A typo should not blank the whole readout; the segments are still useful.
    const result = decodeVin("1HGCM82613A004352");
    expect(result.valid).toBe(false);
    expect(result.wmi).toBe("1HG");
    expect(result.serial).toBe("004352");
  });
});

describe("segments", () => {
  const result = decodeVin(HONDA);

  it("splits the VIN into its standard sections", () => {
    expect(result.wmi).toBe("1HG");
    expect(result.vds).toBe("CM826");
    expect(result.checkDigit).toBe("3");
    expect(result.yearCode).toBe("3");
    expect(result.plantCode).toBe("A");
    expect(result.serial).toBe("004352");
  });

  it("reassembles into the original VIN", () => {
    const joined =
      result.wmi +
      result.vds +
      result.checkDigit +
      result.yearCode +
      result.plantCode +
      result.serial;
    expect(joined).toBe(HONDA);
  });
});

describe("model year", () => {
  it("reads 2003 from a VIN with a numeric eighth-position marker", () => {
    expect(decodeVin(HONDA).modelYear).toBe(2003);
  });

  it("uses position 7 to break the thirty-year ambiguity", () => {
    // Position 7 numeric means 1980-2009; alphabetic means 2010 onward. Same
    // year code 'A' resolves differently.
    const older = decodeVin("1HGCM8" + "2" + "6" + "3" + "A" + "A004352");
    const newer = decodeVin("1HGCM8" + "E" + "6" + "3" + "A" + "A004352");
    expect(older.modelYear).toBe(1980);
    expect(newer.modelYear).toBe(2010);
  });

  it("returns null for a year code that is not in the cycle", () => {
    // U, Z and 0 are never used as year codes. Position 10 here is 'U'.
    expect(decodeVin("1HGCM8263UA004352").modelYear).toBeNull();
  });
});

describe("origin", () => {
  it("names the assembly country from the first character", () => {
    expect(decodeVin(HONDA).country).toBe("United States");
    expect(decodeVin("JHMCM82633A004352").country).toBe("Japan");
    expect(decodeVin("WBACM82633A004352").country).toBe("Germany");
    expect(decodeVin("KMHCM82633A004352").country).toBe("South Korea");
  });

  it("names the manufacturer from the WMI where it is known", () => {
    expect(decodeVin(HONDA).manufacturer).toBe("Honda");
    expect(decodeVin("5YJCM82633A004352").manufacturer).toBe("Tesla");
    expect(decodeVin("WAUCM82633A004352").manufacturer).toBe("Audi");
  });

  it("returns null rather than guessing an unknown WMI", () => {
    expect(decodeVin("ZZZCM82633A004352").manufacturer).toBeNull();
  });
});
