import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_09_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w09-mon": [
    d(
      "w09-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Maximum Subarray and Triangle",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w09-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w09-tue": [
    d(
      "w09-tue-d1",
      "Post-training objective derivations",
      "Notes re-deriving SFT, reward modeling, DPO, PPO-style RLHF, GRPO, RLVR",
      "note",
      "Each objective re-derived with its loss formula and when-to-use tradeoff; derivable from memory at interview depth",
    ),
  ],
  "w09-wed": [
    d(
      "w09-wed-d1",
      "Post-training failure-mode notes",
      "Notes covering reward hacking, KL control, on/off-policy, credit assignment, verifier design, contamination",
      "note",
      "Each failure mode has a concrete example and its detection signal",
    ),
  ],
  "w09-thu": [
    d(
      "w09-thu-d1",
      "Week-4 Post-Training decision executed",
      "Project 3 config or Agentic gate repair artifacts",
      "code",
      "Either Project 3 setup is committed as a reproducible config, or the chosen Agentic gate repair is executed with its artifact",
    ),
  ],
  "w09-fri": [
    d(
      "w09-fri-d1",
      "RL-Text2Vis reward/evaluation defense draft",
      "Defense note with scale changes",
      "note",
      "Reward and evaluation design defended from first principles; three concrete what-would-change-at-scale items drafted",
    ),
  ],
  "w09-sat": [
    d(
      "w09-sat-d1",
      "Ablation matrix prep or first Project 3 experiment",
      "Experiment matrix or first run artifacts",
      "benchmark",
      "Either the ablation matrix is defined with hypotheses and metrics, or the first experiment ran with configs and raw results saved",
    ),
  ],
  "w09-sun": [
    d(
      "w09-sun-d1",
      "Post-training design mock",
      "Mock recording and score sheet",
      "recording",
      "45-minute mock recorded and scored on the rubric; every miss logged with a repair action",
    ),
  ],
  "w09-sun-review": [
    d(
      "w09-sun-review-d1",
      "Week 9 scorecard",
      "Weekly review note",
      "note",
      "Planned vs completed minutes recorded; exit check audited against linked evidence; one repair action scheduled",
    ),
  ],
  "pt-w9-scope": [
    d(
      "pt-w9-scope-d1",
      "Project 3 reproducible config",
      "Post-training lab: task/model selection note plus committed config",
      "code",
      "Narrow verifiable task and small open model chosen; config runs end-to-end and pins seeds and versions",
    ),
  ],
  "pt-w9-sft": [
    d(
      "pt-w9-sft-d1",
      "Clean SFT baseline",
      "Training run artifacts: configs, curves, held-out eval",
      "benchmark",
      "Training completes; held-out fixture eval computed; configs and curves saved and reproducible",
    ),
  ],
};

export const WEEK_09_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w09-sun-review"];

export const WEEK_09_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-09-d1",
    name: "Post-training fluency with defense draft",
    fromTaskKeys: ["w09-tue", "w09-wed", "w09-fri"],
    verify:
      "All six objectives re-derived with loss formulas; failure modes have examples; RL-Text2Vis defense drafted with scale changes",
  },
  {
    id: "wk-09-d2",
    name: "Week-4 decision executed",
    fromTaskKeys: ["w09-thu", "w09-sat"],
    verify:
      "Project 3 config committed or Agentic gate repair executed; ablation matrix defined or first experiment run with saved artifacts",
  },
  {
    id: "wk-09-d3",
    name: "Post-training design mock completed",
    fromTaskKeys: ["w09-sun"],
    verify: "Recorded and scored; misses logged with a repair action",
  },
];
