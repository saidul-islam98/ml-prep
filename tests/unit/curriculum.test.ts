import { describe, expect, it } from "vitest";
import {
  CURRICULUM_WEEKS,
  EVIDENCE_TYPES,
  getCurriculumWeek,
  getAllCurriculumTasks,
  getCurriculumTask,
  getCurriculumTasksForWeek,
  getResource,
} from "../../src/curriculum";
import { EVIDENCE_REQUIRED_TASK_KEYS } from "../../src/curriculum/tasks/deliverables";
import { TEMPLATE_V1 } from "../../src/template/templateV1";

describe("Curriculum Engine", () => {
  it("defines all 14 curriculum weeks with objectives and exit checks", () => {
    expect(CURRICULUM_WEEKS).toHaveLength(14);
    for (let w = 1; w <= 14; w++) {
      const week = getCurriculumWeek(w);
      expect(week).toBeDefined();
      expect(week?.objective.length).toBeGreaterThan(10);
      expect(week?.outcomes.length).toBeGreaterThanOrEqual(1);
      expect(week?.exitCheck.length).toBeGreaterThanOrEqual(1);
      expect(week?.deliverables.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("resolves all canonical template tasks to rich curriculum tasks", () => {
    const allTasks = getAllCurriculumTasks();
    expect(allTasks.length).toBe(TEMPLATE_V1.tasks.length);

    for (const templateTask of TEMPLATE_V1.tasks) {
      const task = getCurriculumTask(templateTask.key);
      expect(task).toBeDefined();
      expect(task?.key).toBe(templateTask.key);
      expect(task?.title).toBe(templateTask.title);
      expect(task?.todos.length).toBeGreaterThanOrEqual(1);
      expect(task?.completionCriteria.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("contains concrete atomic checklists and resources for Week 1 tasks", () => {
    const week1Tasks = getCurriculumTasksForWeek(1);
    expect(week1Tasks.length).toBeGreaterThanOrEqual(4);

    const codingBaseline = getCurriculumTask("w01-mon");
    expect(codingBaseline).toBeDefined();
    expect(codingBaseline?.todos.length).toBe(7);
    expect(codingBaseline?.resources?.map((resource) => resource.id)).toEqual([
      "lc-longest-substring-without-repeating-characters",
      "lc-max-area-of-island",
    ]);
    expect(codingBaseline?.completionCriteria.length).toBe(5);

    const agentEval = getCurriculumTask("w01-tue");
    expect(agentEval).toBeDefined();
    expect(agentEval?.todos.length).toBe(7);
    expect(agentEval?.resources?.length).toBeGreaterThanOrEqual(3);
    expect(agentEval?.knowledgeChecks?.length).toBeGreaterThanOrEqual(3);
  });

  it("gracefully falls back for unknown resources", () => {
    const fallback = getResource("unknown_resource_id");
    expect(fallback.id).toBe("unknown_resource_id");
    expect(fallback.priority).toBe("should");
  });

  it("gives every task at least one concrete verifiable deliverable", () => {
    const seenIds = new Set<string>();
    for (const task of getAllCurriculumTasks()) {
      expect(task.deliverables.length).toBeGreaterThanOrEqual(1);
      for (const deliverable of task.deliverables) {
        expect(deliverable.id).toMatch(new RegExp(`^${task.key}-d\\d+$`));
        expect(seenIds.has(deliverable.id)).toBe(false);
        seenIds.add(deliverable.id);
        expect(deliverable.name.length).toBeGreaterThan(5);
        expect(deliverable.artifact.length).toBeGreaterThan(3);
        expect(deliverable.verify.length).toBeGreaterThan(20);
        expect(EVIDENCE_TYPES).toContain(deliverable.evidenceType);
      }
    }
  });

  it("gives evidence-required tasks at least one required deliverable", () => {
    // A stale or misspelled key in a week file would be silently ignored by
    // the builder, so validate the authored flag keys against the template.
    const templateKeys = new Set(TEMPLATE_V1.tasks.map((task) => task.key));
    for (const key of EVIDENCE_REQUIRED_TASK_KEYS) {
      expect(templateKeys.has(key), `stale evidence-required key ${key}`).toBe(true);
    }
    expect(EVIDENCE_REQUIRED_TASK_KEYS.size).toBe(32);

    for (const task of getAllCurriculumTasks()) {
      if (task.evidenceRequired) {
        expect(task.deliverables.some((deliverable) => deliverable.required)).toBe(true);
      }
    }
    // Spot-check the tiered flags: applications, release, report, mocks, reviews.
    expect(getCurriculumTask("w01-sun")?.evidenceRequired).toBe(true);
    expect(getCurriculumTask("w02-tue")?.evidenceRequired).toBe(true);
    expect(getCurriculumTask("w06-sat")?.evidenceRequired).toBe(true);
    expect(getCurriculumTask("w11-sat")?.evidenceRequired).toBe(true);
    expect(getCurriculumTask("w12-mon")?.evidenceRequired).toBe(true);
    expect(getCurriculumTask("pt-w14-final")?.evidenceRequired).toBe(true);
    for (let w = 1; w <= 14; w++) {
      const reviewKey = w === 14 ? "w14-sun" : `w${String(w).padStart(2, "0")}-sun-review`;
      expect(getCurriculumTask(reviewKey)?.evidenceRequired).toBe(true);
    }
    expect(getCurriculumTask("w02-mon")?.evidenceRequired).toBe(false);
    expect(getCurriculumTask("w07-tue")?.evidenceRequired).toBe(false);
  });

  it("defines structured week-level deliverables backed by real task keys", () => {
    const allTemplateKeys = new Set(TEMPLATE_V1.tasks.map((task) => task.key));
    for (const week of CURRICULUM_WEEKS) {
      expect(week.deliverables.length).toBeGreaterThanOrEqual(2);
      const weekTaskKeys = new Set(week.taskKeys);
      for (const deliverable of week.deliverables) {
        expect(deliverable.id).toMatch(
          new RegExp(`^wk-${String(week.week).padStart(2, "0")}-d\\d+$`),
        );
        expect(deliverable.name.length).toBeGreaterThan(5);
        expect(deliverable.verify.length).toBeGreaterThan(20);
        expect(deliverable.fromTaskKeys.length).toBeGreaterThanOrEqual(1);
        for (const taskKey of deliverable.fromTaskKeys) {
          // Week rollups may cite the prior week's fixed-deadline work
          // (e.g., week 2 aggregates both application submissions).
          expect(allTemplateKeys.has(taskKey)).toBe(true);
          expect(
            weekTaskKeys.has(taskKey) ||
              taskKey.startsWith(`w${String(week.week - 1).padStart(2, "0")}`),
          ).toBe(true);
        }
      }
    }
  });

  it("derives week metadata and task membership from the canonical preparation plan", () => {
    for (const canonical of TEMPLATE_V1.weeks) {
      const week = getCurriculumWeek(canonical.week)!;
      expect(week.title).toBe(canonical.title);
      expect(week.phase).toBe(canonical.phase);
      expect(week.exitCheck.join("; ")).toBe(canonical.exitCheck);
      expect(week.taskKeys).toEqual(
        TEMPLATE_V1.tasks.filter((task) => task.week === canonical.week).map((task) => task.key),
      );
    }
  });

  it("uses specific, auditable execution guidance instead of Week 2-14 placeholders", () => {
    const laterTasks = getAllCurriculumTasks().filter((task) => task.week > 1);
    for (const task of laterTasks) {
      expect(task.summary).not.toMatch(
        /Structured (deep work|practice|application|review) session/i,
      );
      expect(task.todos.length).toBeGreaterThanOrEqual(3);
      expect(task.todos.map((todo) => todo.text).join(" ")).not.toContain(
        "Study foundational technical reference",
      );
      expect(task.deliverables.map((deliverable) => deliverable.artifact).join(" ")).not.toContain(
        `artifacts/${task.key}_deliverable.md`,
      );
      expect(task.completionCriteria).toHaveLength(4);
      for (const resource of task.resources ?? []) {
        expect(resource.url).toMatch(/^https:\/\//);
        expect(resource.instruction.length).toBeGreaterThan(20);
      }
      if (task.category === "deep_work") {
        expect(task.resources?.length).toBeGreaterThan(0);
        expect(task.knowledgeChecks?.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("selects resources that match representative plan topics", () => {
    expect(getCurriculumTask("w03-tue")?.resources?.map((resource) => resource.id)).toContain(
      "bootstrapping_ci",
    );
    expect(getCurriculumTask("w07-wed")?.resources?.map((resource) => resource.id)).toContain(
      "vllm_docs",
    );
    expect(getCurriculumTask("w08-thu")?.resources?.map((resource) => resource.id)).toContain(
      "pytorch_fsdp2",
    );
    expect(
      getCurriculumTask("pt-w10-preference")?.resources?.map((resource) => resource.id),
    ).toContain("dpo_paper");
  });
});
