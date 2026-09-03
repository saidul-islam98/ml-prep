import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_03_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w03-mon": [
    d(
      "w03-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for 3Sum and Container With Most Water",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w03-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w03-tue": [
    d(
      "w03-tue-d1",
      "Metrics module: slices, bootstrap CIs, paired comparison",
      "Project 1 repo: metrics module with stratified slices and paired bootstrap CI",
      "code",
      "Module computes task-level metrics and stratified slices; paired bootstrap CI demonstrated on a model pair; unit tests green",
    ),
  ],
  "w03-wed": [
    d(
      "w03-wed-d1",
      "Evaluation statistics study notes",
      "Notes covering bias, leakage, power, calibration, kappa/alpha, and bootstrap vs permutation tests",
      "note",
      "Each topic has a one-page explanation including when the method misleads and a concrete example",
    ),
  ],
  "w03-thu": [
    d(
      "w03-thu-d1",
      "Human-labeling guide with edge cases and adjudication",
      "Labeling guide document",
      "report",
      "Instructions plus edge-case rulings and an adjudication rule; a colleague can label five items without asking questions",
    ),
  ],
  "w03-fri": [
    d(
      "w03-fri-d1",
      "Judge-bias paper notes",
      "Notes on how each metric can mislead",
      "note",
      "Notes cover order, length, style, and self-preference effects with one concrete example each",
    ),
  ],
  "w03-sat": [
    d(
      "w03-sat-d1",
      "Metrics on synthetic fixtures with provenance",
      "Project 1 repo: fixture suite plus generated metrics table",
      "benchmark",
      "Fixture run produces the metrics table with confidence intervals; provenance fields (data version, seed, config hash) recorded in output",
    ),
  ],
  "w03-sun": [
    d(
      "w03-sun-d1",
      "Statistics mock outcome",
      "Mock recording and score sheet",
      "recording",
      "45-minute mock recorded and scored on the rubric; every miss logged with a repair action",
    ),
  ],
  "w03-sun-review": [
    d(
      "w03-sun-review-d1",
      "Week 3 scorecard",
      "Weekly review note",
      "note",
      "Planned vs completed minutes recorded; exit check audited against linked evidence; one repair action scheduled",
    ),
  ],
};

export const WEEK_03_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w03-sun-review"];

export const WEEK_03_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-03-d1",
    name: "Metrics module validated on synthetic fixtures",
    fromTaskKeys: ["w03-tue", "w03-sat"],
    verify:
      "Task metrics, stratified slices, and paired bootstrap CIs run on fixtures with provenance recorded; tests green",
  },
  {
    id: "wk-03-d2",
    name: "Statistics fluency demonstrated",
    fromTaskKeys: ["w03-wed", "w03-sun"],
    verify:
      "Every studied method has a when-it-misleads explanation; statistics mock scored with misses logged",
  },
  {
    id: "wk-03-d3",
    name: "Human-labeling guide ready for the pilot",
    fromTaskKeys: ["w03-thu"],
    verify:
      "Guide includes instructions, edge cases, and adjudication; a cold reviewer can apply it unaided",
  },
];
