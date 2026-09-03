import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

/**
 * Week 1 deliverable definitions. Task-level deliverables for week 1 live
 * inline in tasks/week01.ts (the handcrafted file); this module carries the
 * week-level rollup and the tiered evidence-required flags.
 */

export const WEEK_01_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {};

export const WEEK_01_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w01-sun", "w01-sun-review"];

export const WEEK_01_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-01-d1",
    name: "Data Analysis and Evaluation application submitted and archived",
    fromTaskKeys: ["w01-sun"],
    verify:
      "Submission confirmation archived with timestamp; submitted resume and answer copies stored; link recorded in the app",
  },
  {
    id: "wk-01-d2",
    name: "Requirement/evidence/gap matrix with ranked top-5 gaps",
    fromTaskKeys: ["w01-wed"],
    verify:
      "Every meaningful JD bullet has a scored evidence row; 0-1 scores mapped to curriculum weeks; unsupported claims flagged",
  },
  {
    id: "wk-01-d3",
    name: "Projects 1-2 specification with architecture and experiment matrix",
    fromTaskKeys: ["w01-thu"],
    verify:
      "Spec includes goals, explicit non-goals, schemas, and 3+ experiments with upfront metrics; feasible on available hardware",
  },
  {
    id: "wk-01-d4",
    name: "Coding baseline with mistake taxonomy",
    fromTaskKeys: ["w01-mon"],
    verify:
      "Two timed mediums with complexity recorded; mistakes classified by root cause; 2-3 personal practice rules written",
  },
  {
    id: "wk-01-d5",
    name: "Evidence pack: six recovered CV metrics plus recorded intro and deep dives",
    fromTaskKeys: ["w01-sat"],
    verify:
      "Each metric traced to a verifiable source (repo, log, paper, or report); recordings exist and were reviewed once",
  },
  {
    id: "wk-01-d6",
    name: "Data/Evaluation resume draft",
    fromTaskKeys: ["w01-fri"],
    verify: "All bullets follow Context-Action-Metric; zero unsupported technical claims",
  },
];
