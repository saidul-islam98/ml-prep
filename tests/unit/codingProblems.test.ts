import { describe, expect, it } from "vitest";
import {
  CODING_PROBLEMS,
  CODING_PROBLEM_ASSIGNMENTS,
  CODING_PROBLEM_BACKLOG_IDS,
  codingProblemResource,
  getCodingProblem,
} from "../../src/curriculum";
import { TEMPLATE_V1 } from "../../src/template/templateV1";

describe("coding problem pool and assignments", () => {
  it("contains 60 unique bookmarked problems with stable ids and valid URLs", () => {
    expect(CODING_PROBLEMS).toHaveLength(60);

    const ids = new Set(CODING_PROBLEMS.map((item) => item.id));
    const slugs = new Set(CODING_PROBLEMS.map((item) => item.slug));
    const urls = new Set(CODING_PROBLEMS.map((item) => item.url));
    expect(ids.size).toBe(60);
    expect(slugs.size).toBe(60);
    expect(urls.size).toBe(60);

    for (const item of CODING_PROBLEMS) {
      expect(item.id).toBe(`lc-${item.slug}`);
      expect(item.url).toBe(`https://leetcode.com/problems/${item.slug}/description/`);
      expect(["easy", "medium"]).toContain(item.difficulty);
      expect(item.pattern.length).toBeGreaterThan(3);
    }
  });

  it("resolves problems by id", () => {
    expect(getCodingProblem("lc-3sum")?.title).toBe("3Sum");
    expect(getCodingProblem("lc-does-not-exist")).toBeUndefined();
  });

  it("assigns problems only to scheduled practice tasks", () => {
    const templateByKey = new Map(TEMPLATE_V1.tasks.map((task) => [task.key, task]));
    for (const [taskKey, problemIds] of Object.entries(CODING_PROBLEM_ASSIGNMENTS)) {
      const templateTask = templateByKey.get(taskKey);
      expect(templateTask, `unknown assignment target ${taskKey}`).toBeDefined();
      expect(templateTask?.category).toBe("practice");
      expect(problemIds.length).toBeGreaterThanOrEqual(1);
      for (const problemId of problemIds) {
        expect(getCodingProblem(problemId), `${problemId} missing from pool`).toBeDefined();
      }
    }
  });

  it("assigns each problem to at most one required-track task", () => {
    const assigned = Object.values(CODING_PROBLEM_ASSIGNMENTS).flat();
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it("covers the documented split: 25 assigned sessions slots, 35 backlog", () => {
    const assigned = Object.values(CODING_PROBLEM_ASSIGNMENTS).flat();
    expect(assigned).toHaveLength(25);
    expect(CODING_PROBLEM_BACKLOG_IDS).toHaveLength(35);
    expect(assigned.length + CODING_PROBLEM_BACKLOG_IDS.length).toBe(CODING_PROBLEMS.length);
    // Two baseline problems, two per Monday session weeks 2-10, one per coding mock.
    expect(CODING_PROBLEM_ASSIGNMENTS["w01-mon"]).toHaveLength(2);
    for (let w = 2; w <= 10; w++) {
      expect(CODING_PROBLEM_ASSIGNMENTS[`w${String(w).padStart(2, "0")}-mon`]).toHaveLength(2);
    }
    expect(CODING_PROBLEM_ASSIGNMENTS["w11-mon"]).toHaveLength(1);
    expect(CODING_PROBLEM_ASSIGNMENTS["w11-wed"]).toHaveLength(1);
    expect(CODING_PROBLEM_ASSIGNMENTS["w12-mon"]).toHaveLength(1);
    expect(CODING_PROBLEM_ASSIGNMENTS["w13-mon"]).toHaveLength(1);
    expect(CODING_PROBLEM_ASSIGNMENTS["w14-mon"]).toHaveLength(1);
  });

  it("builds exercise resources with timed-attempt instructions", () => {
    const item = getCodingProblem("lc-group-anagrams")!;
    const resource = codingProblemResource(item);
    expect(resource.id).toBe("lc-group-anagrams");
    expect(resource.type).toBe("exercise");
    expect(resource.priority).toBe("must");
    expect(resource.url).toMatch(/^https:\/\/leetcode\.com\//);
    expect(resource.instruction).toContain("Timed attempt");
    expect(resource.instruction).toContain("mistake log");
    expect(resource.estimatedMinutes).toBe(40);
  });
});
