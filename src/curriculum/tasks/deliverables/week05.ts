import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_05_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w05-mon": [
    d(
      "w05-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Search in Rotated Sorted Array and Koko Eating Bananas",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w05-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w05-tue": [
    d(
      "w05-tue-d1",
      "Three-annotator study executed",
      "Project 1: pilot instructions plus versioned raw labels",
      "report",
      "Pilot instructions published; at least 40 stratified items labeled independently by three annotators; raw labels version-controlled",
    ),
  ],
  "w05-wed": [
    d(
      "w05-wed-d1",
      "Agreement analysis with pre/post rubric revision",
      "Agreement report: human-human and human-judge, pre and post",
      "benchmark",
      "Agreement computed (kappa or Krippendorff's alpha); rubric revised exactly once; pre/post table with disagreement examples",
    ),
  ],
  "w05-thu": [
    d(
      "w05-thu-d1",
      "Rubric/model verifier with data versioning",
      "Project 1 repo: model-judge verifier, data versioning, deterministic fixtures",
      "code",
      "Verifier runs on fixtures and outputs structured verdicts; fixture reruns are byte-identical; provenance fields present",
    ),
  ],
  "w05-fri": [
    d(
      "w05-fri-d1",
      "Two or three genuine professional conversations logged",
      "Conversation log with thank-you notes",
      "note",
      "Each entry has date, insight gained, and a sent thank-you note that acts on one insight",
    ),
  ],
  "w05-sat": [
    d(
      "w05-sat-d1",
      "Project 2 runner design and sequential baseline",
      "Project 2 repo: runner design doc plus sequential runner",
      "code",
      "Sequential runner has bounded concurrency, retries with jitter, and idempotent task IDs; checkpoint/resume design committed",
    ),
  ],
  "w05-sun": [
    d(
      "w05-sun-d1",
      "Behavioral mock",
      "Mock recording and score sheet",
      "recording",
      "Mock recorded and scored on the rubric; every miss logged with a repair action",
    ),
  ],
  "w05-sun-review": [
    d(
      "w05-sun-review-d1",
      "Week 5 scorecard",
      "Weekly review note",
      "note",
      "Planned vs completed minutes recorded; exit check audited against linked evidence; one repair action scheduled",
    ),
  ],
};

export const WEEK_05_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w05-sun-review"];

export const WEEK_05_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-05-d1",
    name: "Judge and annotation reliability quantified",
    fromTaskKeys: ["w05-tue", "w05-wed", "w05-thu"],
    verify:
      "Three-annotator study completed; human-human and human-judge agreement reported pre/post rubric revision; model verifier running on fixtures",
  },
  {
    id: "wk-05-d2",
    name: "Project 2 runner foundation",
    fromTaskKeys: ["w05-sat"],
    verify:
      "Sequential runner with bounded concurrency, retries, idempotent IDs, and a committed checkpoint/resume design",
  },
  {
    id: "wk-05-d3",
    name: "Behavioral mock completed",
    fromTaskKeys: ["w05-sun"],
    verify: "Recorded and scored; misses logged with a repair action",
  },
];
