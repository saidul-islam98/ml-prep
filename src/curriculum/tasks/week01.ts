import type { CurriculumTask } from "../schemas";
import { CURRICULUM_RESOURCES } from "../resources";

export const WEEK_01_TASKS: CurriculumTask[] = [
  {
    key: "w01-mon",
    week: 1,
    day: 1,
    category: "practice",
    minutes: 120,
    title: "Timed Python coding baseline and mistake log",
    roles: ["data_eval", "agent_env"],
    summary:
      "Measure current interview-coding performance under timed conditions and establish an honest mistake taxonomy.",
    objective:
      "Establish an honest baseline of interview coding speed, bug rates, and complexity derivation before regular interview practice begins.",
    whyItMatters:
      "Cohere technical screens test live algorithmic implementation under 35-45 minute time constraints with zero AI assistance.",
    prerequisites: [
      "Familiarity with standard Python 3 data structures (dicts, heaps, sets, deques)",
    ],
    todos: [
      {
        id: "w01_t1_setup",
        text: "Setup: Open blank editor, disable autocomplete/AI assistance, start timer, prepare mistake-log template.",
        estimatedMinutes: 5,
        required: true,
      },
      {
        id: "w01_t1_p1",
        text: "Problem 1 (assigned): Longest Substring Without Repeating Characters, medium sliding window. State expected time and space complexity. Solve without external help, run test cases, record hints if used.",
        estimatedMinutes: 35,
        required: true,
        output: "Problem 1 code solution and time taken",
      },
      {
        id: "w01_t1_rev1",
        text: "Review 1: Record outcome, completion time, and main failure mode if unsolved.",
        estimatedMinutes: 5,
        required: true,
      },
      {
        id: "w01_t1_p2",
        text: "Problem 2 (assigned): Max Area of Island, medium grid DFS. State complexity upfront. Solve without help, run edge test cases, record hints.",
        estimatedMinutes: 35,
        required: true,
        output: "Problem 2 code solution and time taken",
      },
      {
        id: "w01_t1_rev2",
        text: "Review 2: Record outcome, timing, and edge case gaps.",
        estimatedMinutes: 5,
        required: true,
      },
      {
        id: "w01_t1_analysis",
        text: "Mistake Analysis: Classify errors (algorithm derivation, implementation bug, edge case, Python API, communication, time management).",
        estimatedMinutes: 20,
        required: true,
      },
      {
        id: "w01_t1_reflection",
        text: "Final Reflection: Rewrite at least one failed/messy solution cleanly, establish 2-3 personal rules for future sessions.",
        estimatedMinutes: 15,
        required: true,
        output: "2-3 actionable practice rules",
      },
    ],
    resources: [
      {
        ...CURRICULUM_RESOURCES.neetcode_practice,
        instruction:
          "Pick two medium problems only. Do not browse solutions before the timer ends.",
        estimatedMinutes: 70,
      },
    ],
    deliverables: [
      {
        id: "w01-mon-d1",
        name: "Timed solutions for Longest Substring Without Repeating Characters and Max Area of Island",
        artifact: "Practice solutions for both assigned problems with timings",
        evidenceType: "code",
        verify:
          "Both mediums attempted under 40 minutes each; time and space complexity recorded for both",
        required: true,
      },
      {
        id: "w01-mon-d2",
        name: "Categorized mistake log with top weaknesses",
        artifact: "practice/coding-baseline-YYYY-MM-DD.md",
        evidenceType: "note",
        verify:
          "Mistakes classified by root cause; at least one solution rewritten cleanly; top 2-3 weaknesses identified",
        required: true,
      },
    ],
    completionCriteria: [
      { id: "cc1", text: "2 timed medium problems attempted under 40 min each", required: true },
      { id: "cc2", text: "Time and space complexity recorded for both solutions", required: true },
      { id: "cc3", text: "Mistakes categorized by root cause in the mistake log", required: true },
      { id: "cc4", text: "At least one corrected solution saved cleanly", required: true },
      { id: "cc5", text: "Top 2-3 personal coding weaknesses identified", required: true },
    ],
    knowledgeChecks: [
      {
        id: "kc1",
        question:
          "What is the amortized vs worst-case time complexity of dynamic array resizing and hash table insertions?",
      },
      { id: "kc2", question: "When does BFS guarantee minimum steps compared to Dijkstra or DFS?" },
    ],
    interviewQuestions: [
      "Walk me through how you benchmark your algorithmic problem solving under pressure.",
      "What is your systematic approach when you encounter a hidden test case failure during a live coding round?",
    ],
  },
  {
    key: "w01-tue",
    week: 1,
    day: 2,
    category: "deep_work",
    minutes: 120,
    title: "Agent-eval design baseline and core concepts",
    roles: ["data_eval", "agent_env"],
    summary:
      "Understand how stateful tool-use benchmarks are structured and design the first version of the capstone evaluation environment.",
    objective:
      "Clearly distinguish agent, environment, state, observation, action, transition, trajectory, verifier, and reward, and use these concepts to design a concrete multi-tool benchmark.",
    whyItMatters:
      "Cohere's Agentic Environments and Data/Eval teams build rigorous evaluation harnesses to measure real agent capability beyond surface-level text match.",
    prerequisites: ["Understanding of basic LLM tool-calling APIs and JSON schemas"],
    todos: [
      {
        id: "w01_t2_react",
        text: "ReAct Study: Read the method section, focus on action/observation loops, write 3 bullets explaining ReAct in your own words.",
        estimatedMinutes: 20,
        required: true,
      },
      {
        id: "w01_t2_tau",
        text: "τ-bench Inspection: Read the task/environment design sections. Identify state, tools, target behavior, and evaluation mechanism.",
        estimatedMinutes: 20,
        required: true,
      },
      {
        id: "w01_t2_inspect",
        text: "Inspect AI Analysis: Inspect agent/tool/task/scorer abstractions. Write which ideas should influence your capstone design.",
        estimatedMinutes: 20,
        required: true,
      },
      {
        id: "w01_t2_concepts",
        text: "Concept Definitions: Write definitions for environment, state, observation, action, transition, trajectory, verifier, reward.",
        estimatedMinutes: 20,
        required: true,
        output: "Defined 9 core agent-eval primitives",
      },
      {
        id: "w01_t2_capstone",
        text: "Capstone Environment Sketch: Define state, tools (Email, Calendar, Filesystem), valid actions, and transitions.",
        estimatedMinutes: 25,
        required: true,
        output: "State and tool schema specification",
      },
      {
        id: "w01_t2_example",
        text: "Example Task: Define 1 full task with initial state, user goal, tools, correct trajectory, target state, and success check.",
        estimatedMinutes: 10,
        required: true,
      },
      {
        id: "w01_t2_failures",
        text: "Failure Modes: List at least 5 failure modes (planning, wrong tool, invalid args, state drift, hallucinated completion).",
        estimatedMinutes: 5,
        required: true,
      },
    ],
    resources: [
      CURRICULUM_RESOURCES.react_paper,
      CURRICULUM_RESOURCES.tau_bench,
      CURRICULUM_RESOURCES.inspect_ai,
      CURRICULUM_RESOURCES.webarena,
    ],
    deliverables: [
      {
        id: "w01-tue-d1",
        name: "Agent-eval design baseline document",
        artifact: "docs/agent-eval-design-baseline.md",
        evidenceType: "report",
        verify:
          "Core concepts defined in your own words; one end-to-end task specified; at least 5 failure modes documented; explains why final-answer grading alone fails",
        required: true,
      },
    ],
    completionCriteria: [
      { id: "cc1", text: "Core evaluation concepts defined in your own words", required: true },
      {
        id: "cc2",
        text: "One multi-tool environment architecture sketch completed",
        required: true,
      },
      {
        id: "cc3",
        text: "One complete end-to-end benchmark task specified with expected state transitions",
        required: true,
      },
      {
        id: "cc4",
        text: "At least 5 failure modes documented with root-cause explanations",
        required: true,
      },
      {
        id: "cc5",
        text: "Explicit explanation of why final-answer grading alone fails for agent evaluation",
        required: true,
      },
    ],
    knowledgeChecks: [
      {
        id: "kc1",
        question: "What is the exact distinction between environment state and agent observation?",
      },
      {
        id: "kc2",
        question:
          "Why can final-answer correctness disagree with real task success in tool-using agents?",
      },
      {
        id: "kc3",
        question:
          "What properties make an environment reward programmatically verifiable and deterministic?",
      },
      {
        id: "kc4",
        question:
          "Why is deterministic environment reset crucial for reproducible benchmark results?",
      },
    ],
    interviewQuestions: [
      "How would you design a stateful evaluation environment for a tool-using LLM agent?",
      "How would you verify agent task success without relying exclusively on an LLM-as-a-judge?",
    ],
    project: "eval_harness",
  },
  {
    key: "w01-wed",
    week: 1,
    day: 3,
    category: "application",
    minutes: 120,
    title: "Requirement/evidence/gap rows for both role descriptions",
    roles: ["data_eval", "agent_env"],
    summary:
      "Build an evidence matrix mapping current skills and proof to Cohere Data/Eval and Agentic Environment job requirements.",
    objective:
      "Identify what you already have strong proof for, what you only know theoretically, what you are missing, and rank the top gaps to close over the 14-week plan.",
    whyItMatters:
      "Grounds your entire interview narrative in verifiable evidence, preventing unsupported claims and focusing study time on actual gaps.",
    todos: [
      {
        id: "w01_t3_save_jds",
        text: "Save current Data Analysis & Evaluation and Agentic Environments JDs.",
        estimatedMinutes: 10,
        required: true,
      },
      {
        id: "w01_t3_extract",
        text: "Extract all concrete skill, tooling, research, and systems requirements into individual rows.",
        estimatedMinutes: 30,
        required: true,
      },
      {
        id: "w01_t3_map_evidence",
        text: "Map current evidence from research, publications, projects, open-source code, and coursework.",
        estimatedMinutes: 30,
        required: true,
      },
      {
        id: "w01_t3_score",
        text: "Score each requirement: 0=no evidence, 1=theoretical familiarity, 2=partial hands-on, 3=interview-defensible.",
        estimatedMinutes: 15,
        required: true,
      },
      {
        id: "w01_t3_gaps",
        text: "For all score 0-1 items, define missing proof and map to a specific upcoming curriculum week.",
        estimatedMinutes: 15,
        required: true,
      },
      {
        id: "w01_t3_truthfulness",
        text: "Perform truthfulness audit: flag unsupported resume claims and skills not yet proven.",
        estimatedMinutes: 10,
        required: true,
      },
      {
        id: "w01_t3_rank",
        text: "Rank the top 5 technical gaps that will make the biggest difference in technical screens.",
        estimatedMinutes: 10,
        required: true,
      },
    ],
    resources: [CURRICULUM_RESOURCES.cohere_data_eval_jd, CURRICULUM_RESOURCES.cohere_agent_env_jd],
    deliverables: [
      {
        id: "w01-wed-d1",
        name: "Requirement/evidence/gap matrix",
        artifact: "career/cohere-requirement-evidence-gap.md",
        evidenceType: "report",
        verify:
          "Every meaningful JD requirement mapped to a scored evidence row; 0-1 items linked to future milestones; unsupported claims flagged; top-5 gaps ranked",
        required: true,
      },
    ],
    completionCriteria: [
      {
        id: "cc1",
        text: "Every meaningful JD requirement mapped to an evidence row",
        required: true,
      },
      {
        id: "cc2",
        text: "All scores backed by real deliverables rather than self-assessed confidence",
        required: true,
      },
      {
        id: "cc3",
        text: "All score 0-1 items linked to future curriculum milestones",
        required: true,
      },
      { id: "cc4", text: "Unsupported resume claims explicitly flagged", required: true },
      { id: "cc5", text: "Top 5 technical gaps identified and ranked", required: true },
    ],
    interviewQuestions: [
      "Why are you a strong fit for this specific Cohere role, and where have you demonstrated each capability?",
      "What is the most significant technical area you have been actively improving over recent months?",
    ],
  },
  {
    key: "w01-thu",
    week: 1,
    day: 4,
    category: "application",
    minutes: 120,
    title: "Specify Projects 1-2 scope, architecture, and experiment plans",
    roles: ["data_eval", "agent_env", "post_training"],
    summary:
      "Freeze the architectural scope, non-goals, and experiment matrix for the portfolio projects so future weeks execute rather than redesign.",
    objective:
      "Define two cohesive projects (Project 1: Agent Evaluation Environment, Project 2: Distributed Post-Training / RLHF Lab) that provide interview-defensible proof.",
    whyItMatters:
      "Having a locked scope with explicit non-goals prevents project churn and guarantees completion of high-impact portfolio deliverables.",
    todos: [
      {
        id: "w01_t4_p1_scope",
        text: "Project 1 Spec: 1-sentence goal, domain, 3 tools, task/state/trajectory schemas, verifiers, 3 experiments, minimum demo, non-goals.",
        estimatedMinutes: 45,
        required: true,
        output: "Project 1 technical specification",
      },
      {
        id: "w01_t4_p2_scope",
        text: "Project 2 Spec: 1-sentence goal, scaling/RL emphasis, inputs, outputs, metrics, compute budget, minimum experiment, non-goals.",
        estimatedMinutes: 35,
        required: true,
        output: "Project 2 technical specification",
      },
      {
        id: "w01_t4_arch_diagram",
        text: "Architecture Diagram: Map Task Store -> Agent -> Tools -> Trajectory -> Verifiers -> SFT/DPO data pipeline.",
        estimatedMinutes: 20,
        required: true,
        output: "ASCII/mermaid pipeline architecture diagram",
      },
      {
        id: "w01_t4_exp_matrix",
        text: "Experiment Matrix: Define 3+ experiments with hypotheses, independent variables, metrics, and target artifacts.",
        estimatedMinutes: 20,
        required: true,
      },
    ],
    resources: [
      CURRICULUM_RESOURCES.tau_bench,
      CURRICULUM_RESOURCES.inspect_ai,
      CURRICULUM_RESOURCES.dpo_paper,
    ],
    deliverables: [
      {
        id: "w01-thu-d1",
        name: "Portfolio project specification",
        artifact: "projects/portfolio-project-spec.md",
        evidenceType: "report",
        verify:
          "Both projects have measurable objectives and explicit non-goals; architecture diagram documented; 3+ experiments defined with upfront metrics",
        required: true,
      },
    ],
    completionCriteria: [
      {
        id: "cc1",
        text: "Both projects have measurable objectives and explicit non-goals",
        required: true,
      },
      { id: "cc2", text: "End-to-end architecture diagram created and documented", required: true },
      {
        id: "cc3",
        text: "Three or more concrete experiments defined with upfront metrics",
        required: true,
      },
      {
        id: "cc4",
        text: "Compute requirements confirmed as feasible on available hardware",
        required: true,
      },
      { id: "cc5", text: "Week 2 can start implementation without ambiguity", required: true },
    ],
    interviewQuestions: [
      "Tell me about an agent evaluation system you designed and implemented end-to-end.",
      "How did you transform trajectory verification signals into fine-tuning data or RL rewards?",
    ],
    project: "eval_harness",
  },
  {
    key: "w01-fri",
    week: 1,
    day: 5,
    category: "application",
    minutes: 60,
    title: "Draft Data/Evaluation resume with focused summary",
    roles: ["data_eval"],
    summary:
      "Refactor CV bullets into accomplishment statements (Context -> Action -> Metric) matching the gap matrix.",
    objective:
      "Draft targeted resume bullets directly aligned with Cohere Data/Evaluation job specifications.",
    whyItMatters:
      "Recruiter and engineering screening algorithms filter directly on concrete systems and evaluation keywords.",
    todos: [
      {
        id: "w01_t5_audit",
        text: "Audit previous resume bullets against the gap matrix scores.",
        estimatedMinutes: 20,
        required: true,
      },
      {
        id: "w01_t5_rewrite",
        text: "Rewrite 4-6 project bullets using Context -> Action -> Verifiable Metric format.",
        estimatedMinutes: 30,
        required: true,
      },
      {
        id: "w01_t5_review",
        text: "Proofread and verify formatting against applicant tracking systems guidelines.",
        estimatedMinutes: 10,
        required: true,
      },
    ],
    resources: [CURRICULUM_RESOURCES.cohere_data_eval_jd],
    deliverables: [
      {
        id: "w01-fri-d1",
        name: "Data/Evaluation resume draft",
        artifact: "career/resume-draft-w01.md",
        evidenceType: "resume-diff",
        verify:
          "All bullets follow Context-Action-Metric; zero unsupported technical terms or exaggerated claims",
        required: true,
      },
    ],
    completionCriteria: [
      {
        id: "cc1",
        text: "All bullet points follow Context -> Action -> Metric format",
        required: true,
      },
      { id: "cc2", text: "Zero unsupported technical terms or exaggerated claims", required: true },
    ],
  },
  {
    key: "w01-sat",
    week: 1,
    day: 6,
    category: "application",
    minutes: 180,
    title: "Recover six CV metrics; record intro and deep dives; identify contacts; arrange review",
    roles: ["data_eval", "agent_env"],
    summary:
      "Recover concrete quantitative metrics from past projects and record short audio/video technical overviews.",
    objective:
      "Gather hard proof for all claimed metrics and prepare clear 90-second technical narrative responses.",
    todos: [
      {
        id: "w01_t6_metrics",
        text: "Audit past repos/logs to verify exact metrics for 6 key resume statements.",
        estimatedMinutes: 60,
        required: true,
      },
      {
        id: "w01_t6_intro",
        text: "Record 90-second self-introduction and two project deep-dive explanations.",
        estimatedMinutes: 60,
        required: true,
      },
      {
        id: "w01_t6_network",
        text: "Identify 3 Cohere engineering contacts and arrange peer resume review.",
        estimatedMinutes: 60,
        required: true,
      },
    ],
    resources: [CURRICULUM_RESOURCES.cohere_data_eval_jd, CURRICULUM_RESOURCES.cohere_agent_env_jd],
    deliverables: [
      {
        id: "w01-sat-d1",
        name: "Six recovered CV metrics with sources",
        artifact: "career/recovered-metrics-w01.md",
        evidenceType: "note",
        verify: "Six quantitative project metrics verified against repos, logs, papers, or reports",
        required: true,
      },
      {
        id: "w01-sat-d2",
        name: "Recorded 90-second introduction and two deep dives",
        artifact: "Recording archive",
        evidenceType: "recording",
        verify: "Intro and technical deep dives recorded and reviewed at least once",
        required: true,
      },
    ],
    completionCriteria: [
      { id: "cc1", text: "6 quantitative project metrics verified with evidence", required: true },
      { id: "cc2", text: "Intro and technical deep dives recorded and reviewed", required: true },
    ],
  },
  {
    key: "w01-sun",
    week: 1,
    day: 7,
    category: "application",
    minutes: 90,
    title: "Submit Data Analysis and Evaluation application",
    roles: ["data_eval"],
    summary:
      "Final review of submission package and formal submission of the application to Cohere.",
    objective:
      "Submit the polished Data Analysis and Evaluation application with all verified proof attachments.",
    todos: [
      {
        id: "w01_t7_check",
        text: "Final verification of resume, cover notes, and project links.",
        estimatedMinutes: 30,
        required: true,
      },
      {
        id: "w01_t7_submit",
        text: "Submit application via Cohere careers portal.",
        estimatedMinutes: 30,
        required: true,
      },
      {
        id: "w01_t7_log",
        text: "Archive application submission confirmation and timestamps.",
        estimatedMinutes: 30,
        required: true,
      },
    ],
    resources: [CURRICULUM_RESOURCES.cohere_data_eval_jd],
    deliverables: [
      {
        id: "w01-sun-d1",
        name: "Submitted Data Analysis and Evaluation application",
        artifact: "Application confirmation plus archived resume and answer copies",
        evidenceType: "application",
        verify: "Application submitted and confirmation logged with timestamp",
        required: true,
      },
    ],
    completionCriteria: [
      { id: "cc1", text: "Application submitted and confirmation logged", required: true },
    ],
  },
  {
    key: "w01-sun-review",
    week: 1,
    day: 7,
    category: "review",
    minutes: 30,
    title: "Weekly scorecard and exit check",
    roles: ["data_eval", "agent_env"],
    summary: "Review Week 1 deliverables, score completion, and verify exit check criteria.",
    objective: "Confirm that all Week 1 deliverables exist and prepare for Week 2 execution.",
    todos: [
      {
        id: "w01_t8_audit",
        text: "Verify the 4 required deliverables exist in their target file paths.",
        estimatedMinutes: 10,
        required: true,
      },
      {
        id: "w01_t8_exit",
        text: "Complete the Week 1 Exit Check scorecard.",
        estimatedMinutes: 10,
        required: true,
      },
      {
        id: "w01_t8_preview",
        text: "Preview Week 2 goals and confirm study resources are accessible.",
        estimatedMinutes: 10,
        required: true,
      },
    ],
    deliverables: [
      {
        id: "w01-sun-review-d1",
        name: "Week 1 scorecard",
        artifact: "reviews/week-01-scorecard.md",
        evidenceType: "note",
        verify:
          "All Week 1 exit check items verified with proof; weekly review written and archived",
        required: true,
      },
    ],
    completionCriteria: [
      { id: "cc1", text: "All Week 1 exit check items verified with proof", required: true },
      { id: "cc2", text: "Weekly review written and archived", required: true },
    ],
  },
];
