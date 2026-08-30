import type { CurriculumTask, Day, Category, RoleKey, ProjectKey, TaskResource } from "../schemas";
import { CURRICULUM_RESOURCES } from "../resources";
import { WEEK_01_TASKS } from "./week01";

interface TemplateTaskShape {
  key: string;
  week: number;
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  category: Category;
  minutes: number;
  title: string;
  roles: RoleKey[];
  project?: ProjectKey;
}

const DAY: Record<TemplateTaskShape["day"], Day> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

function resourcesFor(task: TemplateTaskShape): TaskResource[] {
  const title = task.title.toLowerCase();
  const selected: TaskResource[] = [];
  const add = (...resources: TaskResource[]) => {
    for (const resource of resources) {
      if (!selected.some((item) => item.id === resource.id)) selected.push(resource);
    }
  };

  if (/coding problem|coding mock|live.coding/.test(title))
    add(CURRICULUM_RESOURCES.neetcode_practice);
  if (/application|resume|role|cohere|contact|interview narrative/.test(title)) {
    if (task.roles.includes("data_eval")) add(CURRICULUM_RESOURCES.cohere_data_eval_jd);
    if (task.roles.includes("agent_env")) add(CURRICULUM_RESOURCES.cohere_agent_env_jd);
  }
  if (
    /statistic|metric|bootstrap|agreement|calibrat|annotation|judge|ablation|result/.test(title)
  ) {
    add(CURRICULUM_RESOURCES.bootstrapping_ci, CURRICULUM_RESOURCES.inspect_ai);
  }
  if (/agent|environment|trajectory|verifier|tool.use|regression|eval/.test(title)) {
    add(CURRICULUM_RESOURCES.inspect_ai, CURRICULUM_RESOURCES.tau_bench);
  }
  if (/attention|kv.cache|inference|vllm|throughput|latency|batching/.test(title)) {
    add(CURRICULUM_RESOURCES.cs336_stanford, CURRICULUM_RESOURCES.vllm_docs);
  }
  if (/distributed|ddp|fsdp|parallel|ray|process|checkpoint|partition/.test(title)) {
    add(CURRICULUM_RESOURCES.pytorch_fsdp2, CURRICULUM_RESOURCES.ray_core_docs);
  }
  if (/sft|dpo|ppo|grpo|rlhf|rlvr|reward|post.training/.test(title)) {
    add(CURRICULUM_RESOURCES.dpo_paper, CURRICULUM_RESOURCES.grpo_deepseek);
  }
  if (selected.length === 0 && task.category === "practice")
    add(CURRICULUM_RESOURCES.neetcode_practice);
  if (selected.length === 0 && task.category === "deep_work")
    add(CURRICULUM_RESOURCES.cs336_stanford);
  return selected.slice(0, 3);
}

function actionSteps(task: TemplateTaskShape) {
  const title = task.title;
  const chunk = Math.max(10, Math.floor(task.minutes / 4));
  if (task.category === "practice") {
    return [
      {
        id: `${task.key}-prepare`,
        text: `Define the scoring rubric and time box for: ${title}.`,
        estimatedMinutes: chunk,
        required: true,
      },
      {
        id: `${task.key}-execute`,
        text: `Execute the full timed attempt without AI assistance; narrate assumptions and tradeoffs aloud.`,
        estimatedMinutes: chunk * 2,
        required: true,
        output: `practice/${task.key}-attempt.md`,
      },
      {
        id: `${task.key}-review`,
        text: "Score the attempt, classify every miss, and solve missed parts again from a blank page.",
        estimatedMinutes: chunk,
        required: true,
        output: `practice/${task.key}-review.md`,
      },
    ];
  }
  if (task.category === "application") {
    return [
      {
        id: `${task.key}-requirements`,
        text: `Extract the claims, audience, and acceptance conditions for: ${title}.`,
        estimatedMinutes: chunk,
        required: true,
      },
      {
        id: `${task.key}-draft`,
        text: "Create the deliverable using only claims supported by a CV metric, repository, experiment, or recorded example.",
        estimatedMinutes: chunk * 2,
        required: true,
        output: `career/${task.key}-evidence.md`,
      },
      {
        id: `${task.key}-verify`,
        text: "Check role language, remove unsupported claims, archive the final copy or outreach record, and note the next follow-up.",
        estimatedMinutes: chunk,
        required: true,
      },
    ];
  }
  if (task.category === "review") {
    return [
      {
        id: `${task.key}-audit`,
        text: "Open this week's canonical exit check and audit each required artifact or score against linked evidence.",
        estimatedMinutes: chunk,
        required: true,
      },
      {
        id: `${task.key}-score`,
        text: "Record planned versus completed minutes, unfinished work, blockers, and readiness-gate movement.",
        estimatedMinutes: chunk,
        required: true,
        output: `reviews/${task.key}-scorecard.md`,
      },
      {
        id: `${task.key}-decide`,
        text: "Choose one repair action for the highest-risk gap and schedule it without silently expanding the weekly workload.",
        estimatedMinutes: chunk,
        required: true,
      },
    ];
  }
  return [
    {
      id: `${task.key}-contract`,
      text: `Write the input, output, metric, and failure contract for: ${title}.`,
      estimatedMinutes: chunk,
      required: true,
    },
    {
      id: `${task.key}-implement`,
      text: "Implement the smallest reproducible version with deterministic fixtures, typed interfaces, and explicit assumptions.",
      estimatedMinutes: chunk * 2,
      required: true,
      output: `projects/${task.project ?? "technical-depth"}/${task.key}/`,
    },
    {
      id: `${task.key}-verify`,
      text: "Run the relevant tests or experiment, preserve configuration and raw results, and inspect at least one failure.",
      estimatedMinutes: chunk,
      required: true,
    },
    {
      id: `${task.key}-defend`,
      text: "Write the observed result, limitation, production tradeoff, and a two-minute interview explanation.",
      estimatedMinutes: chunk,
      required: true,
      output: `evidence/week-${String(task.week).padStart(2, "0")}/${task.key}.md`,
    },
  ];
}

export function buildCurriculumTasks(templateTasks: TemplateTaskShape[]): CurriculumTask[] {
  return templateTasks.map((task) => {
    const handcrafted = WEEK_01_TASKS.find((item) => item.key === task.key);
    if (handcrafted) return handcrafted;

    const todos = actionSteps(task);
    const deliverable =
      todos.find((todo) => todo.output)?.output ??
      `evidence/week-${String(task.week).padStart(2, "0")}/${task.key}.md`;

    return {
      key: task.key,
      week: task.week,
      day: DAY[task.day],
      category: task.category,
      minutes: task.minutes,
      title: task.title,
      roles: task.roles,
      summary: `${task.title}. Follow the scheduled routine and retain evidence for review.`,
      objective: `Complete the canonical Week ${task.week} session "${task.title}" within ${task.minutes} minutes and leave an auditable result.`,
      whyItMatters: `This session is scheduled by the original preparation plan for ${task.roles.join(" and ")} readiness; its artifact or score feeds the weekly exit check.`,
      prerequisites: [
        `Review the Week ${task.week} objective and any unfinished dependency from the prior scheduled session.`,
      ],
      todos,
      resources: resourcesFor(task),
      deliverables: [deliverable],
      completionCriteria: [
        {
          id: `${task.key}-criteria-actions`,
          text: "Every required action step is checked and execution notes are saved",
          required: true,
        },
        {
          id: `${task.key}-criteria-evidence`,
          text: `The expected evidence exists at ${deliverable} and is linked or described`,
          required: true,
        },
        {
          id: `${task.key}-criteria-verify`,
          text: "The result was tested, scored, submitted, or independently checked as appropriate",
          required: true,
        },
        {
          id: `${task.key}-criteria-reflect`,
          text: "One limitation, mistake, or next repair action is recorded",
          required: true,
        },
      ],
      knowledgeChecks:
        task.category === "deep_work"
          ? [
              {
                id: `${task.key}-knowledge-result`,
                question: `What did ${task.title} demonstrate, and what evidence supports that claim?`,
              },
              {
                id: `${task.key}-knowledge-tradeoff`,
                question: "Which production tradeoff or failure mode matters most, and why?",
              },
            ]
          : undefined,
      interviewQuestions: [
        `Explain your work on ${task.title} using problem, decision, evidence, limitation, and next-step structure.`,
      ],
      project: task.project,
    };
  });
}
