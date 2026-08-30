import type { CurriculumTask, Day, Category, RoleKey, ProjectKey } from "../schemas";
import { CURRICULUM_RESOURCES } from "../resources";
import { WEEK_01_TASKS } from "./week01";

export function buildCurriculumTasks(
  templateTasks: {
    key: string;
    week: number;
    day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
    category: Category;
    minutes: number;
    title: string;
    roles: RoleKey[];
    project?: ProjectKey;
  }[],
): CurriculumTask[] {
  const dayMap: Record<string, Day> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

  return templateTasks.map((t) => {
    // If it's a Week 1 task, return the exact handcrafted task
    const w1Match = WEEK_01_TASKS.find((w) => w.key === t.key);
    if (w1Match) return w1Match;

    const categoryBlueprintTodos: Record<Category, string[]> = {
      deep_work: [
        "Study foundational technical reference and method derivations.",
        "Implement core system logic with strict typing and schema validation.",
        "Verify state transitions and execute edge case test suite.",
        "Document architecture decisions, tradeoffs, and failure modes.",
      ],
      practice: [
        "Set up timer and open blank coding workspace (no autocomplete).",
        "Solve targeted technical problem with stated time/space complexity.",
        "Analyze failure modes, edge cases, and add entry to mistake log.",
        "Cleanly refactor solution and state key interview takeaway.",
      ],
      application: [
        "Extract concrete requirements from role specifications / project scope.",
        "Draft implementation deliverable and verify against acceptance criteria.",
        "Perform truthfulness check and link verified proof artifacts.",
        "Archive deliverable in target repository folder.",
      ],
      review: [
        "Audit completed deliverables against weekly outcomes.",
        "Run end-of-week test suite and check execution minutes.",
        "Complete weekly exit check questionnaire.",
        "Preview upcoming week priorities and unblock dependencies.",
      ],
    };

    const todos = categoryBlueprintTodos[t.category].map((text, idx) => ({
      id: `${t.key}_step_${idx + 1}`,
      text,
      estimatedMinutes: Math.round(t.minutes / 4),
      required: true,
    }));

    return {
      key: t.key,
      week: t.week,
      day: dayMap[t.day] || 1,
      category: t.category,
      minutes: t.minutes,
      title: t.title,
      roles: t.roles,
      summary: `${t.title} — Structured ${t.category.replace("_", " ")} session for Cohere MTS preparation.`,
      objective: `Execute ${t.title.toLowerCase()} to strengthen interview-defensible proof for ${t.roles.join(", ")}.`,
      whyItMatters: `Directly targets key technical expectations and evaluation dimensions for Cohere MTS engineering loops.`,
      todos,
      resources: [CURRICULUM_RESOURCES.inspect_ai, CURRICULUM_RESOURCES.cs336_stanford],
      deliverables: [`artifacts/${t.key}_deliverable.md`],
      completionCriteria: [
        {
          id: `${t.key}_cc1`,
          text: `All ${todos.length} action steps completed with evidence`,
          required: true,
        },
        { id: `${t.key}_cc2`, text: `Deliverable artifact produced and verified`, required: true },
      ],
      knowledgeChecks: [
        {
          id: `${t.key}_kc1`,
          question: `What is the core technical tradeoff addressed in ${t.title}?`,
        },
      ],
      interviewQuestions: [
        `How would you approach ${t.title.toLowerCase()} in a production LLM platform environment?`,
      ],
      project: t.project,
    };
  });
}
