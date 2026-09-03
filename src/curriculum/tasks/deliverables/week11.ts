import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_11_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w11-mon": [
    d(
      "w11-mon-d1",
      "Coding mock 1 recorded and scored",
      "Mock recording plus eight-dimension score sheet",
      "recording",
      "Assigned problem solved under 40 minutes on camera; scored on the rubric; misses logged with a repair action",
    ),
  ],
  "w11-tue": [
    d(
      "w11-tue-d1",
      "Project 1 baseline/ablation matrix results",
      "Matrix results with configs and raw outputs",
      "benchmark",
      "Planned matrix executed; every cell has saved config, raw results, and a one-line finding",
    ),
  ],
  "w11-wed": [
    d(
      "w11-wed-d1",
      "Coding mock 2 recorded and scored",
      "Mock recording plus eight-dimension score sheet",
      "recording",
      "Assigned problem solved under 40 minutes on camera; scored on the rubric; misses logged with a repair action",
    ),
  ],
  "w11-thu": [
    d(
      "w11-thu-d1",
      "Final Project 2 profiling comparison",
      "Comparison section: uncertainty, cost, latency, disagreement",
      "report",
      "Comparison reports uncertainty and cost alongside throughput/latency; judge/human disagreement included where relevant",
    ),
  ],
  "w11-fri": [
    d(
      "w11-fri-d1",
      "Technical report draft and executive summary",
      "Report draft with executive summary",
      "report",
      "Draft includes baselines, ablations, uncertainty, failure taxonomy, and limitations",
    ),
  ],
  "w11-sat": [
    d(
      "w11-sat-d1",
      "Final auditable technical report",
      "Report plus configs and result artifacts",
      "report",
      "Another ML engineer can reproduce the claim from committed configs and artifacts; negative results included",
    ),
  ],
  "w11-sun": [
    d(
      "w11-sun-d1",
      "Research deep-dive mock",
      "Mock recording and score sheet",
      "recording",
      "Mock recorded and scored on the rubric; every miss logged with a repair action",
    ),
  ],
  "w11-sun-review": [
    d(
      "w11-sun-review-d1",
      "Week 11 scorecard",
      "Weekly review note",
      "note",
      "Planned vs completed minutes recorded; exit check audited against linked evidence; one repair action scheduled",
    ),
  ],
  "pt-w11-ablation-setup": [
    d(
      "pt-w11-ablation-setup-d1",
      "Reward-design ablation configured",
      "Ablation configs and run command",
      "code",
      "Ablation variants committed with fixed seeds; single command reproduces the sweep",
    ),
  ],
};

export const WEEK_11_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w11-sat", "w11-sun-review"];

export const WEEK_11_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-11-d1",
    name: "Auditable experiment report",
    fromTaskKeys: ["w11-tue", "w11-fri", "w11-sat"],
    verify:
      "Baseline/ablation matrix executed with saved configs and raw results; report reproducible from committed artifacts",
  },
  {
    id: "wk-11-d2",
    name: "Project 2 profiling comparison finalized",
    fromTaskKeys: ["w11-thu"],
    verify:
      "Comparison reports uncertainty, cost, latency, and disagreement with explicit assumptions",
  },
  {
    id: "wk-11-d3",
    name: "Two coding mocks and a research deep-dive scored",
    fromTaskKeys: ["w11-mon", "w11-wed", "w11-sun"],
    verify: "All three mocks recorded and scored; misses logged with repair actions",
  },
];
