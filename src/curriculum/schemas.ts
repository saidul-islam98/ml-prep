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
  deliverables?: string[];
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
  deliverables: string[];
  coreResources: TaskResource[];
  taskKeys: string[];
}
