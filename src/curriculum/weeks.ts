import type { CurriculumWeek, TaskResource } from "./schemas";
import { TEMPLATE_V1 } from "../template/templateV1";
import { CURRICULUM_RESOURCES } from "./resources";

const RESOURCE_BY_WEEK: Record<number, TaskResource[]> = {
  1: [
    CURRICULUM_RESOURCES.neetcode_practice,
    CURRICULUM_RESOURCES.inspect_ai,
    CURRICULUM_RESOURCES.cohere_data_eval_jd,
    CURRICULUM_RESOURCES.cohere_agent_env_jd,
  ],
  2: [
    CURRICULUM_RESOURCES.neetcode_practice,
    CURRICULUM_RESOURCES.inspect_ai,
    CURRICULUM_RESOURCES.cohere_agent_env_jd,
  ],
  3: [CURRICULUM_RESOURCES.bootstrapping_ci, CURRICULUM_RESOURCES.inspect_ai],
  4: [
    CURRICULUM_RESOURCES.react_paper,
    CURRICULUM_RESOURCES.tau_bench,
    CURRICULUM_RESOURCES.inspect_ai,
  ],
  5: [CURRICULUM_RESOURCES.bootstrapping_ci, CURRICULUM_RESOURCES.inspect_ai],
  6: [CURRICULUM_RESOURCES.inspect_ai],
  7: [CURRICULUM_RESOURCES.cs336_stanford, CURRICULUM_RESOURCES.vllm_docs],
  8: [CURRICULUM_RESOURCES.pytorch_fsdp2, CURRICULUM_RESOURCES.ray_core_docs],
  9: [CURRICULUM_RESOURCES.dpo_paper, CURRICULUM_RESOURCES.grpo_deepseek],
  10: [CURRICULUM_RESOURCES.inspect_ai, CURRICULUM_RESOURCES.tau_bench],
  11: [CURRICULUM_RESOURCES.inspect_ai, CURRICULUM_RESOURCES.bootstrapping_ci],
  12: [
    CURRICULUM_RESOURCES.neetcode_practice,
    CURRICULUM_RESOURCES.cohere_data_eval_jd,
    CURRICULUM_RESOURCES.cohere_agent_env_jd,
  ],
  13: [
    CURRICULUM_RESOURCES.neetcode_practice,
    CURRICULUM_RESOURCES.cohere_data_eval_jd,
    CURRICULUM_RESOURCES.cohere_agent_env_jd,
  ],
  14: [CURRICULUM_RESOURCES.cohere_data_eval_jd, CURRICULUM_RESOURCES.cohere_agent_env_jd],
};

function sentences(value: string): string[] {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Derived from TEMPLATE_V1, the executable preparation plan. */
export const CURRICULUM_WEEKS: CurriculumWeek[] = TEMPLATE_V1.weeks.map((week) => {
  const tasks = TEMPLATE_V1.tasks.filter((task) => task.week === week.week);
  const artifacts = tasks
    .filter((task) => task.category === "application" || task.category === "deep_work")
    .slice(0, 4)
    .map((task) => `Evidence for ${task.title}`);

  return {
    week: week.week,
    title: week.title,
    phase: week.phase,
    objective: `Execute the canonical Week ${week.week} routine for ${week.title.toLowerCase()} and produce evidence that can be defended in Cohere MTS interviews.`,
    outcomes: [
      `${tasks.length} scheduled sessions completed or explicitly rescheduled with reasons`,
      ...sentences(week.exitCheck),
    ],
    exitCheck: sentences(week.exitCheck),
    deliverables:
      artifacts.length > 0
        ? artifacts
        : [`Week ${week.week} scorecard with evidence links and the next weakness to repair`],
    coreResources: RESOURCE_BY_WEEK[week.week] ?? [],
    taskKeys: tasks.map((task) => task.key),
  };
});

export function getCurriculumWeek(weekNum: number): CurriculumWeek | undefined {
  return CURRICULUM_WEEKS.find((week) => week.week === weekNum);
}
