export type ResourcePriority = "MUST" | "SHOULD";

export type ResourceCategory =
  | "Foundation model systems"
  | "Agentic systems"
  | "Evaluation and statistics"
  | "Post-training"
  | "Distributed infrastructure"
  | "Software engineering";

export interface StudyResource {
  id: string;
  title: string;
  url: string;
  priority: ResourcePriority;
  category: ResourceCategory;
  focus: string;
}

export interface WeeklyResourceGuide {
  week: number;
  title: string;
  goal: string;
  resourceIds: string[];
  deliverable: string;
}

export const STUDY_RESOURCES: StudyResource[] = [
  {
    id: "cs336",
    title: "Stanford CS336",
    url: "https://cs336.stanford.edu/",
    priority: "MUST",
    category: "Foundation model systems",
    focus:
      "Transformers, resource accounting, distributed training, inference, evaluation, and RLVR.",
  },
  {
    id: "pytorch-distributed",
    title: "PyTorch Distributed Tutorials",
    url: "https://docs.pytorch.org/tutorials/distributed.html",
    priority: "SHOULD",
    category: "Foundation model systems",
    focus: "DDP, FSDP2, tensor parallelism, DeviceMesh, and distributed checkpointing.",
  },
  {
    id: "nccl",
    title: "NVIDIA NCCL Documentation",
    url: "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/",
    priority: "SHOULD",
    category: "Foundation model systems",
    focus: "Collectives, ranks, topology, and communication bottlenecks.",
  },
  {
    id: "vllm",
    title: "vLLM Documentation",
    url: "https://docs.vllm.ai/",
    priority: "SHOULD",
    category: "Foundation model systems",
    focus: "PagedAttention, KV cache, continuous batching, serving, throughput, and latency.",
  },
  {
    id: "cuda-best-practices",
    title: "CUDA C++ Best Practices",
    url: "https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/",
    priority: "SHOULD",
    category: "Foundation model systems",
    focus: "GPU architecture, memory behavior, profiling, and performance intuition.",
  },
  {
    id: "berkeley-advanced-agents",
    title: "Berkeley Advanced LLM Agents",
    url: "https://rdi.berkeley.edu/adv-llm-agents/sp25",
    priority: "MUST",
    category: "Agentic systems",
    focus: "Reasoning, planning, search, function calling, verification, and agent workflows.",
  },
  {
    id: "berkeley-agents",
    title: "Berkeley LLM Agents",
    url: "https://rdi.berkeley.edu/llm-agents/f24",
    priority: "SHOULD",
    category: "Agentic systems",
    focus: "Agent architectures, memory, planning, tool use, and evaluation.",
  },
  {
    id: "inspect",
    title: "Inspect AI",
    url: "https://inspect.aisi.org.uk/",
    priority: "MUST",
    category: "Agentic systems",
    focus: "Production-quality datasets, tools, agents, scorers, sandboxes, and transcripts.",
  },
  {
    id: "inspect-tutorial",
    title: "Inspect AI Tutorial",
    url: "https://inspect.aisi.org.uk/tutorial.html",
    priority: "MUST",
    category: "Agentic systems",
    focus: "Build and run a first reproducible evaluation.",
  },
  {
    id: "inspect-agents",
    title: "Inspect AI Agents",
    url: "https://inspect.aisi.org.uk/agents.html",
    priority: "MUST",
    category: "Agentic systems",
    focus: "Agent loops, tools, state, and evaluation patterns.",
  },
  {
    id: "inspect-evals",
    title: "Inspect Eval Library",
    url: "https://inspect.aisi.org.uk/evals/",
    priority: "MUST",
    category: "Agentic systems",
    focus: "Reference implementations of modern benchmarks and agent evaluations.",
  },
  {
    id: "openintro",
    title: "OpenIntro Statistics",
    url: "https://www.openintro.org/book/os/",
    priority: "MUST",
    category: "Evaluation and statistics",
    focus: "A primary reference for estimation, inference, testing, and experimental design.",
  },
  {
    id: "islr",
    title: "An Introduction to Statistical Learning",
    url: "https://www.statlearning.com/",
    priority: "MUST",
    category: "Evaluation and statistics",
    focus: "An alternative primary reference for statistical learning and model evaluation.",
  },
  {
    id: "evidently-eval",
    title: "Evidently LLM Evaluation Guide",
    url: "https://www.evidentlyai.com/llm-guide",
    priority: "MUST",
    category: "Evaluation and statistics",
    focus: "Metrics, test datasets, judge evaluation, quality, and monitoring.",
  },
  {
    id: "evidently-judge",
    title: "Evidently LLM-as-a-Judge Guide",
    url: "https://www.evidentlyai.com/llm-guide/llm-as-a-judge",
    priority: "MUST",
    category: "Evaluation and statistics",
    focus: "Judge design, calibration, biases, and validation.",
  },
  {
    id: "evidently-judge-example",
    title: "Practical LLM Judge Tutorial",
    url: "https://docs.evidentlyai.com/examples/LLM_judge",
    priority: "MUST",
    category: "Evaluation and statistics",
    focus: "An implementation-oriented judge evaluation example.",
  },
  {
    id: "inspect-scoring",
    title: "Inspect AI Scoring",
    url: "https://inspect.aisi.org.uk/scoring.html",
    priority: "MUST",
    category: "Evaluation and statistics",
    focus: "Custom scorers, model grading, grouped metrics, standard errors, and rescoring.",
  },
  {
    id: "postgres-sql",
    title: "PostgreSQL SQL Tutorial",
    url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
    priority: "MUST",
    category: "Evaluation and statistics",
    focus: "SQL fundamentals for slicing and analyzing experiment data.",
  },
  {
    id: "trl",
    title: "Hugging Face TRL",
    url: "https://huggingface.co/docs/trl/",
    priority: "MUST",
    category: "Post-training",
    focus: "SFT, DPO, reward modeling, GRPO, custom rewards, and distributed support.",
  },
  {
    id: "trl-quickstart",
    title: "Hugging Face TRL Quickstart",
    url: "https://huggingface.co/docs/trl/main/en/quickstart",
    priority: "MUST",
    category: "Post-training",
    focus: "A practical starting point for the training experiments.",
  },
  {
    id: "ray-core",
    title: "Ray Core",
    url: "https://docs.ray.io/en/latest/ray-core/",
    priority: "MUST",
    category: "Distributed infrastructure",
    focus: "Tasks, actors, objects, resources, scheduling, async execution, and fault tolerance.",
  },
  {
    id: "ray-placement",
    title: "Ray Placement Groups",
    url: "https://docs.ray.io/en/latest/ray-core/scheduling/placement-group.html",
    priority: "MUST",
    category: "Distributed infrastructure",
    focus: "Gang scheduling and topology-aware resource placement.",
  },
  {
    id: "ray-actors",
    title: "Ray Actors",
    url: "https://docs.ray.io/en/latest/ray-core/actors.html",
    priority: "MUST",
    category: "Distributed infrastructure",
    focus: "Stateful workers, GPU resources, and asynchronous execution.",
  },
  {
    id: "ray-fault-tolerance",
    title: "Ray Actor Fault Tolerance",
    url: "https://docs.ray.io/en/latest/ray-core/fault_tolerance/actors.html",
    priority: "MUST",
    category: "Distributed infrastructure",
    focus: "Retries, restarts, recovery, and failure semantics.",
  },
  {
    id: "inspect-running",
    title: "Running Inspect Evaluations",
    url: "https://inspect.aisi.org.uk/running.html",
    priority: "MUST",
    category: "Distributed infrastructure",
    focus: "Parallel execution, retries, resumption, and production evaluation operations.",
  },
  {
    id: "kubernetes",
    title: "Kubernetes Concepts",
    url: "https://kubernetes.io/docs/concepts/",
    priority: "SHOULD",
    category: "Distributed infrastructure",
    focus: "Pods, Jobs, services, configuration, storage, scheduling, and restart behavior.",
  },
  {
    id: "pytest",
    title: "pytest Documentation",
    url: "https://docs.pytest.org/",
    priority: "MUST",
    category: "Software engineering",
    focus: "Unit and integration testing for the capstone.",
  },
  {
    id: "ruff",
    title: "Ruff Documentation",
    url: "https://docs.astral.sh/ruff/",
    priority: "MUST",
    category: "Software engineering",
    focus: "Fast linting and formatting for a production-quality Python repository.",
  },
  {
    id: "mypy",
    title: "mypy Documentation",
    url: "https://mypy.readthedocs.io/",
    priority: "MUST",
    category: "Software engineering",
    focus: "Static type checking and explicit interface contracts.",
  },
  {
    id: "pre-commit",
    title: "pre-commit Documentation",
    url: "https://pre-commit.com/",
    priority: "MUST",
    category: "Software engineering",
    focus: "Automated local quality gates before each commit.",
  },
  {
    id: "docker",
    title: "Docker Get Started",
    url: "https://docs.docker.com/get-started/",
    priority: "MUST",
    category: "Software engineering",
    focus: "Reproducible development and experiment environments.",
  },
  {
    id: "github-actions",
    title: "GitHub Actions Documentation",
    url: "https://docs.github.com/actions",
    priority: "MUST",
    category: "Software engineering",
    focus: "Continuous integration for tests, typing, linting, and reproducibility checks.",
  },
];

export const WEEKLY_RESOURCE_GUIDES: WeeklyResourceGuide[] = [
  {
    week: 1,
    title: "Transformer systems fundamentals",
    goal: "Explain and measure compute, memory, prefill, decode, batching, and KV-cache trade-offs.",
    resourceIds: ["cs336", "vllm", "cuda-best-practices"],
    deliverable: "notes/week01-transformer-systems.md",
  },
  {
    week: 2,
    title: "Distributed training and communication",
    goal: "Reason about DDP, FSDP, tensor/pipeline parallelism, collectives, and failure diagnosis.",
    resourceIds: ["pytorch-distributed", "nccl", "cs336"],
    deliverable: "notes/week02-distributed-training.md",
  },
  {
    week: 3,
    title: "Statistics for model evaluation",
    goal: "Design paired experiments with confidence intervals, significance tests, effect sizes, and strata.",
    resourceIds: ["openintro", "islr", "postgres-sql"],
    deliverable: "evaluation/statistical_analysis.py + notes/week03-evaluation-statistics.md",
  },
  {
    week: 4,
    title: "Dataset quality and LLM evaluation",
    goal: "Treat evaluation data and judges as scientific instruments with measurable validity and reliability.",
    resourceIds: [
      "evidently-eval",
      "evidently-judge",
      "evidently-judge-example",
      "inspect-scoring",
    ],
    deliverable: "evaluation/evaluator.py",
  },
  {
    week: 5,
    title: "Agent architecture and environment design",
    goal: "Model agents as policies acting in stateful, partially observable environments.",
    resourceIds: ["berkeley-advanced-agents", "inspect-agents", "inspect-evals"],
    deliverable: "notes/agent-benchmark-comparison.md",
  },
  {
    week: 6,
    title: "Stateful multi-tool agent environment",
    goal: "Build deterministic email, calendar, and filesystem environments with typed trajectories.",
    resourceIds: ["inspect", "inspect-tutorial", "inspect-agents"],
    deliverable: "Working environment with reset and transition tests",
  },
  {
    week: 7,
    title: "Verifiers, rewards, and failure analysis",
    goal: "Compare final-response, state, trajectory, hybrid, and human evaluation signals.",
    resourceIds: ["inspect-scoring", "evidently-judge", "openintro"],
    deliverable: "analysis/verifier_agreement.md",
  },
  {
    week: 8,
    title: "Scalable evaluation execution",
    goal: "Run fault-tolerant evaluations with explicit scheduling, retries, observability, and scaling metrics.",
    resourceIds: [
      "ray-core",
      "ray-placement",
      "ray-actors",
      "ray-fault-tolerance",
      "inspect-running",
      "kubernetes",
    ],
    deliverable: "distributed/ray_runner.py + results/scaling_and_fault_tolerance.md",
  },
  {
    week: 9,
    title: "SFT and training-data engineering",
    goal: "Convert verified trajectories into leak-resistant train, validation, and generalization datasets.",
    resourceIds: ["trl", "trl-quickstart", "cs336"],
    deliverable: "training/sft/ + results/sft_results.md",
  },
  {
    week: 10,
    title: "Preference optimization and reward modeling",
    goal: "Construct and audit preferences, then compare base, SFT, and DPO behavior.",
    resourceIds: ["trl", "trl-quickstart", "cs336"],
    deliverable: "training/dpo/ + results/preference_quality.md",
  },
  {
    week: 11,
    title: "GRPO, RLVR, and environment debugging",
    goal: "Train with verifiable rewards and document a real reward, verifier, or optimization failure.",
    resourceIds: ["trl", "cs336", "ray-core"],
    deliverable: "training/grpo/ + results/rl_debugging_case_study.md",
  },
  {
    week: 12,
    title: "Capstone and reproducibility",
    goal: "Turn the work into a tested, typed, reproducible, documented, interview-ready portfolio artifact.",
    resourceIds: ["pytest", "ruff", "mypy", "pre-commit", "docker", "github-actions"],
    deliverable: "Complete agent-eval-lab repository and technical report",
  },
];

export const BENCHMARKS_TO_KNOW = {
  must: [
    "ReAct",
    "Toolformer",
    "SWE-bench",
    "WebArena",
    "AgentBench",
    "τ-bench / τ²-bench",
    "OSWorld",
    "HealthBench",
  ],
  should: [
    "Reflexion",
    "BrowserGym",
    "GAIA",
    "WebShop",
    "AgentDojo",
    "ToolBench",
    "TUA-Bench",
    "BrowseComp",
    "GDPval",
  ],
} as const;

export function resourcesForWeek(week: number): StudyResource[] {
  const guide = WEEKLY_RESOURCE_GUIDES.find((candidate) => candidate.week === week);
  if (!guide) return [];
  return guide.resourceIds
    .map((id) => STUDY_RESOURCES.find((resource) => resource.id === id))
    .filter((resource): resource is StudyResource => Boolean(resource));
}
