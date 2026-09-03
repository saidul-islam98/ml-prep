import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_10_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w10-mon": [
    d(
      "w10-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Combination Sum and Generate Parentheses",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w10-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w10-tue": [
    d(
      "w10-tue-d1",
      "Three failures converted into regression tasks",
      "Project 1 task set: three versioned regression tasks",
      "code",
      "Each regression task traces to an observed trajectory failure; no new environments added; tasks run in the existing harness",
    ),
  ],
  "w10-wed": [
    d(
      "w10-wed-d1",
      "Privacy and telemetry study notes",
      "Notes covering consent, PII minimization, retention, access control, auditability, prompt injection, tool authorization",
      "note",
      "Each topic covered with a production-design implication and one mitigations example",
    ),
  ],
  "w10-thu": [
    d(
      "w10-thu-d1",
      "Complaint-to-eval drills",
      "Five complaint analyses: hypotheses, slices, tasks, rubrics, thresholds",
      "report",
      "Each ambiguous complaint produces a testable hypothesis, data slice, task sketch, rubric, and a decision threshold",
    ),
  ],
  "w10-fri": [
    d(
      "w10-fri-d1",
      "Resumes and evidence sheets updated with Project 2 evidence",
      "Updated resume and evidence sheet",
      "resume-diff",
      "Project 2 metrics added with exact numbers and hardware disclosure; zero unsupported claims",
    ),
  ],
  "w10-sat": [
    d(
      "w10-sat-d1",
      "Regression gates enforced in CI",
      "Project 1 repo: CI thresholds plus case write-up",
      "commit",
      "Threshold checks run in CI and fail on regression; latest commit green; write-up committed",
    ),
  ],
  "w10-sun": [
    d(
      "w10-sun-d1",
      "Sixty-minute improvement case",
      "Case recording and answer notes",
      "recording",
      "Case answer proves improvement without hiding regressions; recommendation ties metrics to a product or model decision",
    ),
  ],
  "w10-sun-review": [
    d(
      "w10-sun-review-d1",
      "Week 10 scorecard",
      "Weekly review note",
      "note",
      "Planned vs completed minutes recorded; exit check audited against linked evidence; one repair action scheduled",
    ),
  ],
  "pt-w10-preference": [
    d(
      "pt-w10-preference-d1",
      "Preference or verifiable-reward method run",
      "Training run artifacts: configs, reward logs, KL/entropy curves",
      "benchmark",
      "One DPO or small GRPO run completes; reward components and KL/entropy logged per checkpoint",
    ),
  ],
  "pt-w10-rewards": [
    d(
      "pt-w10-rewards-d1",
      "Deterministic verifiers wired as rewards",
      "Reward wiring code plus logged reward components",
      "code",
      "Project 1 verifiers produce rewards; logs separate reward components and record KL/entropy trends",
    ),
  ],
};

export const WEEK_10_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w10-sat", "w10-sun-review"];

export const WEEK_10_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-10-d1",
    name: "Regression gates live in CI",
    fromTaskKeys: ["w10-tue", "w10-sat"],
    verify:
      "Three observed failures are versioned regression tasks with thresholds enforced in CI; latest commit green; write-up committed",
  },
  {
    id: "wk-10-d2",
    name: "Product-evaluation drills complete",
    fromTaskKeys: ["w10-wed", "w10-thu", "w10-sun"],
    verify:
      "Five complaints converted to hypotheses/slices/rubrics/thresholds; sixty-minute case ties metrics to a product decision",
  },
  {
    id: "wk-10-d3",
    name: "Application materials updated with Project 2 evidence",
    fromTaskKeys: ["w10-fri"],
    verify:
      "Resumes and evidence sheets cite exact Project 2 metrics and hardware; zero unsupported claims",
  },
];
