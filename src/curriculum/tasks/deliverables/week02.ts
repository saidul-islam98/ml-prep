import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_02_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w02-mon": [
    d(
      "w02-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Group Anagrams and Top K Frequent Elements",
      "code",
      "Both problems solved within 40 minutes each with stated time/space complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w02-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified (algorithm, implementation, edge case, API, communication, timing) and one correction scheduled within 7 days",
    ),
  ],
  "w02-tue": [
    d(
      "w02-tue-d1",
      "Submitted Agentic Environments application",
      "Application confirmation plus archived resume and answer copies",
      "application",
      "Confirmation archived with timestamp; Canada location option confirmed in the form; submitted copy stored",
    ),
    d(
      "w02-tue-d2",
      "Second technical review applied",
      "Reviewer feedback notes",
      "note",
      "Each accepted change improves evidence or clarity; rejected suggestions carry a written reason",
      false,
    ),
  ],
  "w02-wed": [
    d(
      "w02-wed-d1",
      "Task, environment, trajectory schemas and verifier skeleton",
      "Project 1 repo: schema modules and verifier skeleton committed with tests",
      "code",
      "Schemas type-check; verifier skeleton produces a verdict on one worked example; commit pushed with tests green",
    ),
  ],
  "w02-thu": [
    d(
      "w02-thu-d1",
      "Environment and trajectory implementation with tests",
      "Project 1 repo: environment implementation and trajectory logger",
      "code",
      "A scripted task executes end-to-end; trajectory captures tool calls, arguments, results, and errors; unit tests green",
    ),
  ],
  "w02-fri": [
    d(
      "w02-fri-d1",
      "Narratives 1-2 recorded: benchmark design and agent failure",
      "Recording archive",
      "recording",
      "Each story states problem, constraint, decision, alternatives, measured result, and limitation",
    ),
  ],
  "w02-sat": [
    d(
      "w02-sat-d1",
      "End-to-end smoke run: task to trajectory to verifier",
      "Project 1 repo: smoke script plus committed fixture output",
      "code",
      "One seeded task produces an agent run, a full trajectory, and a verifier verdict via a single command; output committed as a fixture",
    ),
  ],
  "w02-sun": [
    d(
      "w02-sun-d1",
      "Narratives 3-4 recorded: inference optimization and disagreement story",
      "Recording archive",
      "recording",
      "Both stories recorded in 90-second and five-minute versions with exact metrics",
    ),
  ],
  "w02-sun-review": [
    d(
      "w02-sun-review-d1",
      "Week 2 scorecard",
      "Weekly review note",
      "note",
      "Planned vs completed minutes recorded; every exit-check item audited against linked evidence; one repair action scheduled",
    ),
  ],
};

export const WEEK_02_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w02-tue", "w02-sun-review"];

export const WEEK_02_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-02-d1",
    name: "Both Cohere applications submitted and archived",
    fromTaskKeys: ["w01-sun", "w02-tue"],
    verify:
      "Confirmation for each application archived; submitted copies stored; application log updated",
  },
  {
    id: "wk-02-d2",
    name: "Four interview narratives recorded",
    fromTaskKeys: ["w02-fri", "w02-sun"],
    verify:
      "Benchmark design, agent failure, inference optimization, and disagreement stories each state decision, measured result, and limitation",
  },
  {
    id: "wk-02-d3",
    name: "Project 1 skeleton running end-to-end",
    fromTaskKeys: ["w02-wed", "w02-thu", "w02-sat"],
    verify:
      "Schemas, environment, trajectory logging, and verifier skeleton merged with tests; single-command smoke run produces a verifier verdict",
  },
  {
    id: "wk-02-d4",
    name: "Week 2 scorecard with exit check",
    fromTaskKeys: ["w02-sun-review"],
    verify: "Exit check audited item by item; one repair action scheduled for the riskiest gap",
  },
];
