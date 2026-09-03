/**
 * Schema definitions for the concrete, atomic, execution-focused curriculum.
 * Defines tasks, atomic sub-steps, targeted resources, completion criteria,
 * knowledge checks, interview payoffs, and weekly objectives.
 */

export type Day = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Category = "deep_work" | "practice" | "application" | "review";

export type RoleKey = "data_eval" | "agent_env" | "post_training";

export type ProjectKey = "eval_harness" | "agent_env" | "post_training";

export type ResourcePriority = "must" | "should" | "stretch";

export type ResourceType =
  "lecture" | "paper" | "docs" | "tutorial" | "exercise" | "job-description" | "reference" | "repo";

export interface TaskResource {
  id: string;
  title: string;
  url: string;
  priority: ResourcePriority;
  type: ResourceType;
  instruction: string;
  estimatedMinutes?: number;
}

export interface AtomicTask {
  id: string;
  text: string;
  estimatedMinutes?: number;
  required: boolean;
  output?: string;
}

export interface CompletionCriterion {
  id: string;
  text: string;
  required: boolean;
}

export interface KnowledgeCheck {
  id: string;
  question: string;
  answerGuidance?: string;
}

/**
 * The kind of proof a deliverable produces. Evidence itself is recorded
 * in-app (Supabase evidence_url / evidence_note) and never stored in the
 * repository (WEBAPP_SPEC.md privacy rules).
 */
export type EvidenceType =
  | "note"
  | "code"
  | "commit"
  | "notebook"
  | "benchmark"
  | "diagram"
  | "resume-diff"
  | "screenshot"
  | "recording"
  | "report"
  | "application"
  | "file";

export const EVIDENCE_TYPES: EvidenceType[] = [
  "note",
  "code",
  "commit",
  "notebook",
  "benchmark",
  "diagram",
  "resume-diff",
  "screenshot",
  "recording",
  "report",
  "application",
  "file",
];

/**
 * A concrete, verifiable artifact a task must produce. "Verify" states the
 * objective check that proves the artifact exists and meets the bar.
 */
export interface TaskDeliverable {
  id: string;
  name: string;
  artifact: string;
  evidenceType: EvidenceType;
  verify: string;
  required: boolean;
}

/** A week-level outcome artifact composed from one or more task deliverables. */
export interface WeekDeliverable {
  id: string;
  name: string;
  fromTaskKeys: string[];
  verify: string;
}

export interface CurriculumTask {
  key: string;
  week: number;
  day: Day;
  category: Category;
  minutes: number;
  title: string;
  roles: RoleKey[];

  summary: string;
  objective: string;
  whyItMatters?: string;

  prerequisites?: string[];
  todos: AtomicTask[];
  resources?: TaskResource[];
  deliverables: TaskDeliverable[];
  /**
   * Tiered enforcement: when true, completing the task requires evidence
   * (HTTPS link or note) captured in the completion gate. Authored per task
   * in the curriculum deliverables files.
   */
  evidenceRequired?: boolean;
  completionCriteria: CompletionCriterion[];
  knowledgeChecks?: KnowledgeCheck[];
  interviewQuestions?: string[];
  project?: ProjectKey;
}

export interface CurriculumWeek {
  week: number;
  title: string;
  phase: string;
  objective: string;
  outcomes: string[];
  exitCheck: string[];
  deliverables: WeekDeliverable[];
  coreResources: TaskResource[];
  taskKeys: string[];
}
