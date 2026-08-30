import { describe, expect, it } from "vitest";
import {
  CURRICULUM_WEEKS,
  getCurriculumWeek,
  getAllCurriculumTasks,
  getCurriculumTask,
  getCurriculumTasksForWeek,
  getResource,
} from "../../src/curriculum";
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
    expect(codingBaseline?.resources?.[0].instruction).toContain("Pick two medium problems only");
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
});
