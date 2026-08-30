/**
 * Unified Curriculum Module
 * Exposes concrete, atomic, execution-focused curriculum metadata.
 */

import { CURRICULUM_WEEKS, getCurriculumWeek } from "./weeks";
import { CURRICULUM_RESOURCES, getResource } from "./resources";
import { WEEK_01_TASKS } from "./tasks/week01";
import { buildCurriculumTasks } from "./tasks/allTasks";
import { TEMPLATE_V1, type TemplateTask } from "../template/templateV1";
import type { CurriculumTask } from "./schemas";

export * from "./schemas";
export { CURRICULUM_WEEKS, getCurriculumWeek, CURRICULUM_RESOURCES, getResource, WEEK_01_TASKS };

// Map all canonical template tasks into rich curriculum tasks
const ALL_CURRICULUM_TASKS: CurriculumTask[] = buildCurriculumTasks(
  TEMPLATE_V1.tasks.map((t: TemplateTask) => ({
    key: t.key,
    week: t.week,
    day: t.day,
    category: t.category,
    minutes: t.minutes,
    title: t.title,
    roles: t.roles,
    project:
      t.project === "evalops"
        ? "eval_harness"
        : t.project === "rollout_lab"
          ? "agent_env"
          : t.project === "post_training_lab"
            ? "post_training"
            : undefined,
  })),
);

export function getAllCurriculumTasks(): CurriculumTask[] {
  return ALL_CURRICULUM_TASKS;
}

export function getCurriculumTask(key: string): CurriculumTask | undefined {
  return (
    ALL_CURRICULUM_TASKS.find((t) => t.key === key) || WEEK_01_TASKS.find((t) => t.key === key)
  );
}

export function getCurriculumTasksForWeek(weekNum: number): CurriculumTask[] {
  return ALL_CURRICULUM_TASKS.filter((t) => t.week === weekNum);
}
