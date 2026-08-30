import { describe, expect, it } from "vitest";
import {
  STUDY_RESOURCES,
  WEEKLY_RESOURCE_GUIDES,
  resourcesForWeek,
} from "../../src/lib/studyResources";

describe("study resource catalog", () => {
  it("keeps a unique, secure catalog of all comprehensive references", () => {
    expect(STUDY_RESOURCES).toHaveLength(32);
    expect(new Set(STUDY_RESOURCES.map((resource) => resource.id)).size).toBe(32);
    expect(STUDY_RESOURCES.every((resource) => resource.url.startsWith("https://"))).toBe(true);
  });

  it("provides resolvable guidance for each week in the supplemental guide", () => {
    expect(WEEKLY_RESOURCE_GUIDES.map((guide) => guide.week)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);

    for (const guide of WEEKLY_RESOURCE_GUIDES) {
      expect(resourcesForWeek(guide.week)).toHaveLength(guide.resourceIds.length);
      expect(resourcesForWeek(guide.week).length).toBeGreaterThan(0);
    }
  });
});
