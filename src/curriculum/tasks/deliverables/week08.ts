import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_08_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w08-mon": [
    d(
      "w08-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Jump Game and Best Time to Buy and Sell Stock II",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w08-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w08-tue": [
    d(
      "w08-tue-d1",
      "Parallelism study notes with memory accounting",
      "Notes covering DDP, FSDP/ZeRO, tensor/pipeline parallelism, checkpointing, accumulation, mixed precision, all-reduce",
      "note",
      "Each strategy explained with parameter/activation/optimizer memory accounting and a chosen-example estimate",
    ),
  ],
  "w08-wed": [
    d(
      "w08-wed-d1",
      "Profiling workflow checklist",
      "Notes covering GPU utilization, stalls, communication, fragmentation, OOM diagnosis",
      "note",
      "Checklist maps each symptom to its measurement command and a worked diagnosis example",
    ),
  ],
  "w08-thu": [
    d(
      "w08-thu-d1",
      "DDP correctness and failure-resume tests",
      "Project 2 repo: single vs two-process DDP test plus interruption test",
      "code",
      "Single-process and two-process DDP runs produce identical results; an interrupted run resumes without duplicated samples",
    ),
  ],
  "w08-fri": [
    d(
      "w08-fri-d1",
      "Container and distributed data partitioning tests",
      "Project 2 repo: container image plus partitioning unit tests",
      "code",
      "Container builds and runs the workload; partitioning tests prove disjoint, complete coverage across ranks",
    ),
  ],
  "w08-sat": [
    d(
      "w08-sat-d1",
      "Benchmark report with before/after profiling and demo",
      "Benchmark report: tokens/s, peak memory, scaling efficiency, assumptions",
      "report",
      "Report quantifies a real bottleneck with before/after measurements and explicit hardware assumptions; demo recorded",
    ),
  ],
  "w08-sun": [
    d(
      "w08-sun-d1",
      "Training-system design mock",
      "Mock recording and score sheet",
      "recording",
      "45-minute mock recorded and scored on the rubric; every miss logged with a repair action",
    ),
  ],
  "w08-sun-review": [
    d(
      "w08-sun-review-d1",
      "Week 8 scorecard with Project 2 completion-gate self-check",
      "Weekly review note with gate checklist",
      "note",
      "Gate items audited: rollout and DDP smoke pass, interrupted runs resume, profiling quantifies a bottleneck; one repair action scheduled",
    ),
  ],
};

export const WEEK_08_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w08-sun-review"];

export const WEEK_08_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-08-d1",
    name: "Distributed correctness demonstrated",
    fromTaskKeys: ["w08-thu", "w08-fri"],
    verify:
      "Single vs two-process DDP results identical; interrupted run resumes without duplicated samples; partitioning tests green in a container",
  },
  {
    id: "wk-08-d2",
    name: "Benchmark report with measured bottleneck",
    fromTaskKeys: ["w08-sat"],
    verify:
      "Tokens/s, peak memory, and scaling efficiency reported with assumptions and before/after profiler evidence; demo recorded",
  },
  {
    id: "wk-08-d3",
    name: "Training-system design mock completed",
    fromTaskKeys: ["w08-sun"],
    verify: "Recorded and scored; misses logged with a repair action",
  },
];
