import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_04_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w04-mon": [
    d(
      "w04-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Minimum Size Subarray Sum and Longest Repeating Character Replacement",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w04-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w04-tue": [
    d(
      "w04-tue-d1",
      "Two tool-use environments with trajectory logging",
      "Project 1 repo: two environment implementations",
      "code",
      "Both environments run their scripted tasks; trajectory log captures tool calls, arguments, results, errors, and latency",
    ),
  ],
  "w04-wed": [
    d(
      "w04-wed-d1",
      "Failure injection suite",
      "Project 1 repo: failure fixtures",
      "code",
      "At least one recorded example per failure category: invalid arguments, irrelevant retrieval, timeout, stale state, partial completion",
    ),
  ],
  "w04-thu": [
    d(
      "w04-thu-d1",
      "First baseline with trajectory inspection log",
      "Baseline results plus inspection notes covering 20+ trajectories",
      "benchmark",
      "Baseline scores computed on the task set; at least 20 trajectories manually inspected with per-trajectory notes",
    ),
  ],
  "w04-fri": [
    d(
      "w04-fri-d1",
      "Post-Training evidence honesty check",
      "Evidence-sheet note with go/no-go lean",
      "note",
      "Training-ownership evidence assessed honestly; Canada option confirmed in the Agentic application form",
    ),
  ],
  "w04-sat": [
    d(
      "w04-sat-d1",
      "Improved baseline and demo run",
      "Project 1 repo: baseline fixes, verifier improvements, demo script and output",
      "code",
      "Baseline fixes committed with before/after scores; demo run reproduced from the committed script",
    ),
  ],
  "w04-sun": [
    d(
      "w04-sun-d1",
      "Enterprise-agent eval design mock",
      "Mock recording and score sheet",
      "recording",
      "45-minute design mock recorded and scored on the rubric; every miss logged with a repair action",
    ),
  ],
  "w04-sun-review": [
    d(
      "w04-sun-review-d1",
      "Week 4 scorecard with Post-Training go/no-go",
      "Weekly review note with recorded decision",
      "note",
      "Go/no-go decision recorded with rationale; exit check audited; one repair action scheduled",
    ),
  ],
};

export const WEEK_04_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w04-sun-review"];

export const WEEK_04_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-04-d1",
    name: "End-to-end agent evaluation run with failure coverage",
    fromTaskKeys: ["w04-tue", "w04-wed", "w04-thu", "w04-sat"],
    verify:
      "Two environments run with trajectory logging; every failure category has an example fixture; baseline scores with 20+ inspected trajectories",
  },
  {
    id: "wk-04-d2",
    name: "Post-Training go/no-go decision recorded",
    fromTaskKeys: ["w04-fri", "w04-sun-review"],
    verify: "Decision recorded with honest evidence assessment and rationale",
  },
  {
    id: "wk-04-d3",
    name: "Eval design mock completed",
    fromTaskKeys: ["w04-sun"],
    verify: "45-minute enterprise-agent eval design mock recorded and scored; misses logged",
  },
];
