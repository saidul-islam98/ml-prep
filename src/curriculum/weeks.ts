import type { CurriculumWeek } from "./schemas";
import { CURRICULUM_RESOURCES } from "./resources";

export const CURRICULUM_WEEKS: CurriculumWeek[] = [
  {
    week: 1,
    title: "Positioning, Baselines & Project Scope",
    phase: "Foundational",
    objective:
      "Establish coding, agent-eval, and Cohere-fit baselines so the rest of the curriculum targets real engineering gaps instead of assumptions.",
    outcomes: [
      "Coding baseline measured and mistake log established",
      "Agent-eval architecture and stateful benchmarking understood",
      "Cohere requirement/evidence gap matrix created and ranked",
      "Portfolio projects 1 and 2 scopes, architectures, and experiments frozen",
    ],
    exitCheck: [
      "Data/Eval application evidence mapped with proof links",
      "Agentic Env evidence mapped with proof links",
      "Unsupported resume claims identified and flagged",
      "Project 1 (Agent Eval Environment) architecture frozen",
      "Project 2 (Distributed Scaling / RLHF Lab) experiment scope frozen",
    ],
    deliverables: [
      "practice/coding-baseline-YYYY-MM-DD.md",
      "docs/agent-eval-design-baseline.md",
      "career/cohere-requirement-evidence-gap.md",
      "projects/portfolio-project-spec.md",
    ],
    coreResources: [
      CURRICULUM_RESOURCES.react_paper,
      CURRICULUM_RESOURCES.tau_bench,
      CURRICULUM_RESOURCES.inspect_ai,
      CURRICULUM_RESOURCES.cohere_data_eval_jd,
      CURRICULUM_RESOURCES.cohere_agent_env_jd,
    ],
    taskKeys: [
      "w01_coding_baseline",
      "w01_agent_eval_design",
      "w01_gap_matrix",
      "w01_project_spec",
      "w01_study_guide_review",
    ],
  },
  {
    week: 2,
    title: "Evaluation Harness Core & Task Generation",
    phase: "Foundational",
    objective:
      "Build the minimum deterministic stateful evaluation harness with structured input schema, trajectory recording, and reproducible execution.",
    outcomes: [
      "Task schema with deterministic initial state implemented",
      "Tool interface sandbox with mock tools running",
      "Trajectory recorder capturing actions and observations built",
    ],
    exitCheck: [
      "10 benchmark tasks running deterministically end-to-end",
      "JSONL trajectory output matches schema with full execution metadata",
    ],
    deliverables: [
      "src/eval_harness/core.py",
      "tests/test_harness_deterministic.py",
      "artifacts/baseline_trajectories.jsonl",
    ],
    coreResources: [CURRICULUM_RESOURCES.tau_bench, CURRICULUM_RESOURCES.inspect_ai],
    taskKeys: ["w02_harness_core", "w02_task_schema", "w02_trajectory_recorder"],
  },
  {
    week: 3,
    title: "Stateful Verifiers & Programmatic Rewards",
    phase: "Foundational",
    objective:
      "Implement programmatically verifiable state assertions and contrast state-level verification with LLM-as-a-judge grading.",
    outcomes: [
      "State-based verifiers for filesystem, calendar, and email tools built",
      "Unit-tested scoring engine with partial-credit capability",
      "Failure mode taxonomy covering state drift, hallucinated tool calls, and loop limits",
    ],
    exitCheck: [
      "Zero false-positive verifications on 20 synthetic edge-case trajectories",
      "Verified agreement report between programmatic verifier and manual labeling",
    ],
    deliverables: ["src/eval_harness/verifiers.py", "docs/verifier-design-and-failure-taxonomy.md"],
    coreResources: [CURRICULUM_RESOURCES.webarena, CURRICULUM_RESOURCES.tau_bench],
    taskKeys: ["w03_verifiers", "w03_failure_taxonomy", "w03_scoring_engine"],
  },
  {
    week: 4,
    title: "Tool Sandbox & Docker Isolation",
    phase: "Foundational",
    objective:
      "Enforce secure, hermetic execution of agent tool actions with containerized sandbox environments and reproducible state resets.",
    outcomes: [
      "Docker/containerized sandbox environment for tool execution",
      "Deterministic state snapshot and fast rollback engine (<100ms reset)",
      "Multi-turn agent loop with error recovery mechanisms",
    ],
    exitCheck: [
      "Reproducible reset verification test passing across 50 sequential runs",
      "Sandboxed environment prevents host filesystem or network leakage",
    ],
    deliverables: [
      "docker/sandbox.Dockerfile",
      "src/sandbox/manager.py",
      "tests/test_sandbox_isolation.py",
    ],
    coreResources: [CURRICULUM_RESOURCES.inspect_ai],
    taskKeys: ["w04_sandbox_isolation", "w04_state_reset", "w04_agent_loop"],
  },
  {
    week: 5,
    title: "Statistical Evaluation & Bootstrap Significance",
    phase: "Core Deepening",
    objective:
      "Implement rigorous statistical evaluation for stochastic LLM systems with paired bootstrap confidence intervals and power analysis.",
    outcomes: [
      "Empirical bootstrap confidence interval module with pass^k calculation",
      "Paired permutation test for comparing prompt/model interventions",
      "Sample-size sizing curve for benchmark reliability",
    ],
    exitCheck: [
      "Confidence interval report generated for Project 1 benchmark results",
      "Statistical significance test validates model comparison accurately",
    ],
    deliverables: ["src/eval_harness/stats.py", "notebooks/statistical_evaluation_demo.ipynb"],
    coreResources: [CURRICULUM_RESOURCES.bootstrapping_ci],
    taskKeys: ["w05_bootstrap_ci", "w05_pass_at_k", "w05_significance_testing"],
  },
  {
    week: 6,
    title: "Synthetic Data & Verifier-Guided Curation",
    phase: "Core Deepening",
    objective:
      "Generate and filter high-quality multi-turn trajectory datasets using state verifiers as programmatic data quality filters.",
    outcomes: [
      "Automated trajectory generation pipeline with temperature sampling",
      "Rejection sampling filter retaining only verified successful trajectories",
      "Negative mining pipeline capturing informative execution failures",
    ],
    exitCheck: [
      "Curated dataset of 500 verified trajectories formatted for fine-tuning",
      "Data distribution analysis report with failure taxonomy breakdown",
    ],
    deliverables: ["src/data/synthetic_curator.py", "data/sft_verified_trajectories.jsonl"],
    coreResources: [CURRICULUM_RESOURCES.cs336_stanford],
    taskKeys: ["w06_synthetic_generation", "w06_rejection_sampling", "w06_data_curation"],
  },
  {
    week: 7,
    title: "Supervised Fine-Tuning (SFT) & Multi-Turn Loss",
    phase: "Core Deepening",
    objective:
      "Train multi-turn agent models with loss masking on agent reasoning and tool call tokens only.",
    outcomes: [
      "PyTorch multi-turn training loop with custom collator and loss mask",
      "Evaluation checkpointing against Project 1 benchmark suite",
      "Ablation comparing zero-shot vs SFT agent performance",
    ],
    exitCheck: [
      "Trained 7B/8B model achieves measurable gain on verified benchmark pass rate",
      "Wandb/tensorboard training logs showing clean loss convergence",
    ],
    deliverables: ["src/training/sft_trainer.py", "docs/sft-agent-experiments.md"],
    coreResources: [CURRICULUM_RESOURCES.cs336_stanford, CURRICULUM_RESOURCES.pytorch_fsdp2],
    taskKeys: ["w07_sft_pipeline", "w07_loss_masking", "w07_sft_evaluation"],
  },
  {
    week: 8,
    title: "Preference Optimization (DPO / RLVR)",
    phase: "Core Deepening",
    objective:
      "Align agent models using Direct Preference Optimization (DPO) and Rule-based Verifiable Rewards (RLVR).",
    outcomes: [
      "Paired preference dataset constructed from verified vs failed trajectories",
      "DPO loss implementation with reference policy log-ratio tracking",
      "Rule-based reward verifier integration for RLVR exploration",
    ],
    exitCheck: [
      "DPO model demonstrates reduced loop rate and higher tool-use accuracy",
      "Implicit reward margin analysis validates preference separation",
    ],
    deliverables: ["src/training/dpo_trainer.py", "docs/dpo-vs-sft-comparison.md"],
    coreResources: [CURRICULUM_RESOURCES.dpo_paper, CURRICULUM_RESOURCES.grpo_deepseek],
    taskKeys: ["w08_preference_data", "w08_dpo_training", "w08_rlvr_exploration"],
  },
  {
    week: 9,
    title: "Distributed Scaling with Ray & FSDP2",
    phase: "Advanced Systems",
    objective:
      "Scale rollout generation and training across multiple workers using Ray actor pools and PyTorch FSDP2.",
    outcomes: [
      "Ray actor pool for parallel environment rollout generation",
      "FSDP2 distributed training configuration with mixed precision",
      "Throughput benchmarking across worker scales",
    ],
    exitCheck: [
      "Distributed rollout engine achieves linear speedup across 8+ worker actors",
      "FSDP2 training runs without GPU OOM or gradient sync deadlocks",
    ],
    deliverables: [
      "src/distributed/ray_rollouts.py",
      "src/distributed/fsdp2_config.py",
      "docs/scaling-benchmarks.md",
    ],
    coreResources: [CURRICULUM_RESOURCES.ray_core_docs, CURRICULUM_RESOURCES.pytorch_fsdp2],
    taskKeys: ["w09_ray_rollouts", "w09_fsdp2_training", "w09_scaling_benchmarks"],
  },
  {
    week: 10,
    title: "High-Throughput Serving & Inference Optimization",
    phase: "Advanced Systems",
    objective:
      "Optimize agent inference throughput using continuous batching, KV caching, and vLLM serving infrastructure.",
    outcomes: [
      "vLLM engine integration with custom sampling parameters",
      "KV cache memory accounting and prefill/decode latency breakdown",
      "Benchmarking script measuring tokens/second under concurrent client loads",
    ],
    exitCheck: [
      "Inference server sustains 100+ requests/sec with p95 latency under target",
      "KV cache exhaustion gracefully handled with request queueing",
    ],
    deliverables: ["src/serving/vllm_service.py", "benchmarks/throughput_benchmark.py"],
    coreResources: [CURRICULUM_RESOURCES.vllm_docs, CURRICULUM_RESOURCES.cs336_stanford],
    taskKeys: ["w10_vllm_serving", "w10_kv_cache_analysis", "w10_throughput_benchmarking"],
  },
  {
    week: 11,
    title: "Failure Taxonomy & Error Analysis Lab",
    phase: "Review & Mock",
    objective:
      "Perform deep quantitative failure analysis on agent systems to uncover grounding, planning, and tool-drift root causes.",
    outcomes: [
      "Multi-label failure classification on 200+ failed agent trajectories",
      "Root-cause attribution report (planning vs tool error vs context loss)",
      "Targeted mitigation prompts and guardrail verifiers",
    ],
    exitCheck: [
      "Comprehensive error analysis document with actionable mitigations",
      "Inter-annotator agreement measured for qualitative error tags",
    ],
    deliverables: ["docs/failure-analysis-report.md", "src/eval_harness/error_analyzer.py"],
    coreResources: [CURRICULUM_RESOURCES.webarena, CURRICULUM_RESOURCES.inspect_ai],
    taskKeys: ["w11_failure_attribution", "w11_guardrail_mitigation", "w11_error_report"],
  },
  {
    week: 12,
    title: "Mock Interview Loops & Live Coding",
    phase: "Review & Mock",
    objective:
      "Execute full timed mock interview loops across ML Systems, Coding, System Design, and Cohere Behavioral criteria.",
    outcomes: [
      "8-dimension mock interview rubric self-assessment",
      "Timed 45-minute live ML coding session (Attention / KV Cache / Loss)",
      "45-minute system design session: Distributed Evaluation Platform",
    ],
    exitCheck: [
      "Recorded scores across all 8 evaluation dimensions in Practice view",
      "Written solutions with complexity proofs for all mock problems",
    ],
    deliverables: ["practice/mock-interview-session-1.md", "practice/mock-interview-session-2.md"],
    coreResources: [
      CURRICULUM_RESOURCES.neetcode_practice,
      CURRICULUM_RESOURCES.cohere_data_eval_jd,
    ],
    taskKeys: ["w12_mock_ml_coding", "w12_mock_system_design", "w12_mock_behavioral"],
  },
  {
    week: 13,
    title: "Portfolio Polish, Repositories & Resume Packaging",
    phase: "Review & Mock",
    objective:
      "Polish open-source repository deliverables, documentation, architecture diagrams, and evidence links.",
    outcomes: [
      "Public READMEs with architecture diagrams and reproducible quickstart commands",
      "Resume bullet points grounded in concrete metrics and deliverables",
      "Live interactive demonstration for both capstone projects",
    ],
    exitCheck: [
      "All project repositories have green CI builds and clean documentation",
      "Resume diff updated with verified evidence links",
    ],
    deliverables: [
      "projects/eval-harness/README.md",
      "projects/agent-sandbox/README.md",
      "career/resume-cohere-mts.md",
    ],
    coreResources: [
      CURRICULUM_RESOURCES.cohere_data_eval_jd,
      CURRICULUM_RESOURCES.cohere_agent_env_jd,
    ],
    taskKeys: ["w13_repo_polish", "w13_resume_bullets", "w13_live_demos"],
  },
  {
    week: 14,
    title: "Final Interview Readiness & Technical Defence",
    phase: "Review & Mock",
    objective:
      "Final defence readiness, answering any technical challenge on the capstones, tradeoffs, and systems concepts.",
    outcomes: [
      "Comprehensive Q&A deck covering 40+ high-probability interview questions",
      "Technical deep-dive defence for every design tradeoff made",
      "Final readiness sign-off across Data/Eval and Agent Env loops",
    ],
    exitCheck: [
      "100% of readiness gates cleared with verified artifacts attached",
      "Ready for real-world technical interviews",
    ],
    deliverables: ["career/cohere-technical-qa-defence.md", "career/final-readiness-signoff.md"],
    coreResources: [
      CURRICULUM_RESOURCES.cohere_data_eval_jd,
      CURRICULUM_RESOURCES.cohere_agent_env_jd,
    ],
    taskKeys: ["w14_qa_defence", "w14_tradeoff_deepdive", "w14_final_signoff"],
  },
];

export function getCurriculumWeek(weekNum: number): CurriculumWeek | undefined {
  return CURRICULUM_WEEKS.find((w) => w.week === weekNum);
}
