import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_13_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w13-mon": [
    d(
      "w13-mon-d1",
      "Coding mock recorded and scored",
      "Mock recording plus eight-dimension score sheet",
      "recording",
      "Assigned problem solved under 40 minutes on camera; scored on the rubric; misses logged",
    ),
  ],
  "w13-tue": [
    d(
      "w13-tue-d1",
      "Deliberate practice block 1 on the two lowest mock dimensions",
      "Drill log with before/after attempts",
      "note",
      "Drills target the week-12 weakness list; a before/after attempt pair saved for each drilled dimension",
    ),
  ],
  "w13-wed": [
    d(
      "w13-wed-d1",
      "Deliberate practice block 2 on the two lowest mock dimensions",
      "Drill log with before/after attempts",
      "note",
      "Drills continue on the same weaknesses; improvement measurable between attempts",
    ),
  ],
  "w13-thu": [
    d(
      "w13-thu-d1",
      "Role-specific system-design mock 1",
      "Mock recording plus score sheet",
      "recording",
      "45-minute design recorded and scored on framing, estimates, bottlenecks, reliability, and tradeoffs",
    ),
  ],
  "w13-fri": [
    d(
      "w13-fri-d1",
      "Contact follow-ups with a concrete artifact",
      "Follow-up log",
      "note",
      "Each follow-up shares a concrete artifact or result; current role postings re-checked and logged",
    ),
  ],
  "w13-sat": [
    d(
      "w13-sat-d1",
      "Role-specific system-design mock 2 with from-scratch re-answers",
      "Mock recording plus re-answer notes",
      "recording",
      "Design recorded and scored; earlier missed questions re-answered from a blank page after 48 hours",
    ),
  ],
  "w13-sun-review": [
    d(
      "w13-sun-review-d1",
      "Exit check: two consecutive mocks at readiness thresholds",
      "Threshold assessment note",
      "note",
      "Two consecutive mocks meet all readiness thresholds, or the blocking gaps have a written repair plan",
    ),
  ],
  "pt-w13-eval": [
    d(
      "pt-w13-eval-d1",
      "Held-out evaluation with confidence intervals and cost",
      "Held-out eval results vs prompting/SFT",
      "benchmark",
      "Held-out comparison includes confidence intervals and compute/cost disclosure; results reproducible from configs",
    ),
  ],
  "pt-w13-docs": [
    d(
      "pt-w13-docs-d1",
      "Failure analysis and model card",
      "Failure analysis notes plus model card",
      "report",
      "Failure examples categorized with causes; model card covers data, training, evaluation, and limitations",
    ),
  ],
};

export const WEEK_13_EVIDENCE_REQUIRED_TASK_KEYS: string[] = [
  "w13-mon",
  "w13-thu",
  "w13-sat",
  "w13-sun-review",
];

export const WEEK_13_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-13-d1",
    name: "Targeted repair demonstrated on the weakest dimensions",
    fromTaskKeys: ["w13-tue", "w13-wed"],
    verify:
      "Week-12 top weaknesses drilled with before/after attempt pairs showing measurable improvement",
  },
  {
    id: "wk-13-d2",
    name: "Role-specific design mocks passed",
    fromTaskKeys: ["w13-thu", "w13-sat"],
    verify:
      "Two system-design mocks recorded and scored; missed questions re-answered from scratch after 48 hours",
  },
  {
    id: "wk-13-d3",
    name: "Readiness threshold check",
    fromTaskKeys: ["w13-sun-review"],
    verify: "Two consecutive mocks meet all readiness thresholds or have a written repair plan",
  },
];
