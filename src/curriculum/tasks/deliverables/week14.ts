import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_14_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w14-mon": [
    d(
      "w14-mon-d1",
      "Simulated loop day 1: live coding and ML fundamentals recorded and scored",
      "Loop recordings plus score sheets",
      "recording",
      "Assigned problem solved under 40 minutes; fundamentals answers begin with a direct thesis; scored on the rubric; misses logged",
    ),
  ],
  "w14-tue": [
    d(
      "w14-tue-d1",
      "Simulated loop day 1: ML system design recorded and scored",
      "Loop recording plus score sheet",
      "recording",
      "45-minute design recorded and scored on framing, estimates, bottlenecks, reliability, and tradeoffs",
    ),
  ],
  "w14-wed": [
    d(
      "w14-wed-d1",
      "Simulated loop day 2: project deep-dive and behavioral recorded and scored",
      "Loop recording plus score sheet",
      "recording",
      "Deep-dive defends decisions, evidence, and limitations from the actual artifacts; scored on the rubric",
    ),
  ],
  "w14-thu": [
    d(
      "w14-thu-d1",
      "Final interview notes pack",
      "Notes: metrics, equations, estimates, Cohere reasons, interviewer questions",
      "report",
      "Pack covers exact project metrics, key equations, back-of-envelope estimates, role-specific Cohere reasons, and questions per interviewer type",
    ),
  ],
  "w14-fri": [
    d(
      "w14-fri-d1",
      "Application review and maintenance cadence",
      "Application decisions plus maintenance schedule",
      "note",
      "Each open application has a follow-up decision; weekly maintenance plan (two coding, one design, one review, one mock) booked",
    ),
  ],
  "w14-sat": [
    d(
      "w14-sat-d1",
      "Final readiness-gate review",
      "Gate-by-gate assessment with evidence links",
      "report",
      "Every readiness gate passes with linked evidence or carries a written mitigation",
    ),
  ],
  "w14-sun": [
    d(
      "w14-sun-d1",
      "Complete readiness matrix and maintenance plan",
      "Readiness matrix plus maintenance plan",
      "report",
      "Matrix covers every gate for every target role; maintenance cadence confirmed on the calendar",
    ),
  ],
  "pt-w14-final": [
    d(
      "pt-w14-final-d1",
      "Project 3 final write-up with reproducibility check",
      "Final report: reproducible configs, curves, ablation table, model card, scale section",
      "report",
      "Configs reproduce the headline numbers; what-would-change-at-Cohere-scale section written; a positive result is not required",
    ),
  ],
};

export const WEEK_14_EVIDENCE_REQUIRED_TASK_KEYS: string[] = [
  "w14-mon",
  "w14-tue",
  "w14-wed",
  "w14-sat",
  "w14-sun",
  "pt-w14-final",
];

export const WEEK_14_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-14-d1",
    name: "Full simulated loop completed and scored",
    fromTaskKeys: ["w14-mon", "w14-tue", "w14-wed"],
    verify:
      "Two-day loop across coding, fundamentals, design, project, and behavioral recorded and scored on every dimension",
  },
  {
    id: "wk-14-d2",
    name: "Interview notes pack finalized",
    fromTaskKeys: ["w14-thu"],
    verify:
      "Metrics, equations, estimates, Cohere reasons, and interviewer questions complete and rehearsed once",
  },
  {
    id: "wk-14-d3",
    name: "All readiness gates pass or have written mitigations",
    fromTaskKeys: ["w14-sat", "w14-sun"],
    verify:
      "Gate matrix complete for every target role; each failing gate has a written mitigation and a maintenance-cadence action",
  },
];
