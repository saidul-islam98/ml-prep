import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_12_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w12-mon": [
    d(
      "w12-mon-d1",
      "Live-coding mock recorded and scored",
      "Mock recording plus eight-dimension score sheet",
      "recording",
      "Assigned problem solved under 40 minutes on camera with continuous narration; scored on the rubric; misses logged",
    ),
  ],
  "w12-tue": [
    d(
      "w12-tue-d1",
      "ML fundamentals mock recorded and scored",
      "Mock recording plus score sheet",
      "recording",
      "Mock recorded; every answer begins with a direct thesis; scored on the rubric; misses logged",
    ),
  ],
  "w12-wed": [
    d(
      "w12-wed-d1",
      "ML system-design mock recorded and scored",
      "Mock recording plus score sheet",
      "recording",
      "Design covers goals, estimates, bottlenecks, failure modes, and tradeoffs; scored on the rubric; misses logged",
    ),
  ],
  "w12-thu": [
    d(
      "w12-thu-d1",
      "Project/behavioral mock recorded and scored",
      "Mock recording plus score sheet",
      "recording",
      "Stories use decision-result-limitation structure with exact metrics; scored on the rubric; misses logged",
    ),
  ],
  "w12-fri": [
    d(
      "w12-fri-d1",
      "Both resumes and evidence sheets updated with the two public projects",
      "Updated resumes and evidence sheets",
      "resume-diff",
      "Both role resumes cite Project 1 and 2 evidence with exact metrics; zero unsupported claims",
    ),
  ],
  "w12-sat": [
    d(
      "w12-sat-d1",
      "Four-hour take-home simulation package",
      "Take-home repo: tests, README, assumptions, analysis, clean final commit",
      "code",
      "Repo contains passing tests, a README stating assumptions, an analysis section, and a clean commit history",
    ),
  ],
  "w12-sun-review": [
    d(
      "w12-sun-review-d1",
      "Scored recordings with top-five weakness list",
      "Score consolidation plus ranked weakness list",
      "report",
      "All four mocks scored on every dimension; top-five weaknesses ranked with a repair plan for week 13",
    ),
  ],
  "pt-w12-ablation": [
    d(
      "pt-w12-ablation-d1",
      "Reward-design ablation complete",
      "Ablation table plus hacking inspection notes",
      "benchmark",
      "Ablation table produced from committed configs; at least one reward-hacking or generalization failure inspected with example outputs",
    ),
  ],
};

export const WEEK_12_EVIDENCE_REQUIRED_TASK_KEYS: string[] = [
  "w12-mon",
  "w12-tue",
  "w12-wed",
  "w12-thu",
  "w12-sat",
  "w12-sun-review",
];

export const WEEK_12_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-12-d1",
    name: "Four scored mocks with a ranked weakness list",
    fromTaskKeys: ["w12-mon", "w12-tue", "w12-wed", "w12-thu", "w12-sun-review"],
    verify:
      "Live coding, fundamentals, system design, and project/behavioral mocks all recorded and scored; no dimension left unscored; top-five weaknesses ranked",
  },
  {
    id: "wk-12-d2",
    name: "Take-home simulation package",
    fromTaskKeys: ["w12-sat"],
    verify: "Repo with passing tests, README with assumptions, analysis, and clean final commit",
  },
  {
    id: "wk-12-d3",
    name: "Application materials updated with both public projects",
    fromTaskKeys: ["w12-fri"],
    verify: "Both resumes and evidence sheets cite exact P1/P2 metrics; zero unsupported claims",
  },
];
