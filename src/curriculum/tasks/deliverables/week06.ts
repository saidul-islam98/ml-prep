import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_06_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w06-mon": [
    d(
      "w06-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Daily Temperatures and Asteroid Collision",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w06-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w06-tue": [
    d(
      "w06-tue-d1",
      "Test, typing, linting, and CI pipeline for Project 1",
      "Project 1 repo: CI workflow and test suite",
      "commit",
      "Unit and integration tests, typing, and linting all pass in CI on the latest commit",
    ),
  ],
  "w06-wed": [
    d(
      "w06-wed-d1",
      "Structured logs, cost/latency reporting, and credential-free smoke test",
      "Project 1 repo: log schema, cost/latency report, smoke command",
      "code",
      "Smoke test passes from a fresh clone with zero credentials; log schema documented; cost and latency reported per run",
    ),
  ],
  "w06-thu": [
    d(
      "w06-thu-d1",
      "Two-page design doc and results chart",
      "Design document plus one results chart",
      "report",
      "Doc covers design tradeoffs and non-goals; chart generated from committed result artifacts",
    ),
  ],
  "w06-fri": [
    d(
      "w06-fri-d1",
      "Reviewer criticism log",
      "Public issue tracker entries",
      "note",
      "Three domain reviewers asked for technical criticism; every response tracked as a public issue",
    ),
  ],
  "w06-sat": [
    d(
      "w06-sat-d1",
      "Project 1 v0.1 release",
      "Git tag v0.1, release notes, and short demo recording",
      "commit",
      "Tag pushed; release notes published; fresh clone passes the smoke suite; demo recorded",
    ),
  ],
  "w06-sun": [
    d(
      "w06-sun-d1",
      "Recorded Project 1 design deep-dive with rubric self-score",
      "Deep-dive recording plus self-score sheet",
      "recording",
      "At least five minutes recorded; all eight rubric dimensions self-scored with justification",
    ),
  ],
  "w06-sun-review": [
    d(
      "w06-sun-review-d1",
      "Week 6 scorecard with Project 1 completion-gate self-check",
      "Weekly review note with gate checklist",
      "note",
      "Completion-gate items audited against evidence (fresh clone smoke, auditable comparison, report with uncertainty and limitations); one repair action scheduled",
    ),
  ],
};

export const WEEK_06_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w06-sat", "w06-sun-review"];

export const WEEK_06_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-06-d1",
    name: "Project 1 v0.1 published",
    fromTaskKeys: ["w06-tue", "w06-wed", "w06-sat"],
    verify:
      "Tagged release with tests, typing, linting green in CI; credential-free smoke passes from a fresh clone; demo recorded",
  },
  {
    id: "wk-06-d2",
    name: "Design doc and results chart published",
    fromTaskKeys: ["w06-thu"],
    verify: "Two-page doc with tradeoffs; chart generated from committed artifacts",
  },
  {
    id: "wk-06-d3",
    name: "Reviewer feedback loop open",
    fromTaskKeys: ["w06-fri"],
    verify: "Three reviewers engaged; every criticism tracked publicly",
  },
  {
    id: "wk-06-d4",
    name: "Design deep-dive recording with self-score",
    fromTaskKeys: ["w06-sun"],
    verify: "Five-plus minutes recorded; eight-dimension self-score completed",
  },
];
