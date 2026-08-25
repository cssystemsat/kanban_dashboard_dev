import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { getSheetCsv, getSheetNameByGid } from "./googleSheets";

describe("Google Sheets credentials", () => {
  it("accesses the configured primary and secondary spreadsheets", async () => {
    expect(ENV.googleServiceAccountEmail).toMatch(/@.*\.iam\.gserviceaccount\.com$/);
    expect(ENV.googlePrivateKey).toContain("BEGIN PRIVATE KEY");
    expect(ENV.googleSheetsPrimaryId).toHaveLength(44);
    expect(ENV.googleSheetsSecondaryId).toHaveLength(44);

    const [primaryName, secondaryName] = await Promise.all([
      getSheetNameByGid(0, "primary"),
      getSheetNameByGid(1250838098, "secondary"),
    ]);
    expect(primaryName).toBeTruthy();
    expect(secondaryName).toBeTruthy();

    const [primaryCsv, secondaryCsv] = await Promise.all([
      getSheetCsv("primary", 0),
      getSheetCsv("secondary", 1250838098),
    ]);
    expect(primaryCsv.split(/\r?\n/).length).toBeGreaterThan(1);
    expect(secondaryCsv.split(/\r?\n/).length).toBeGreaterThan(1);
  }, 30_000);
});
