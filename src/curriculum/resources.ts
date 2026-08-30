import type { TaskResource } from "./schemas";

export const CURRICULUM_RESOURCES: Record<string, TaskResource> = {
  // Foundations & Papers
  react_paper: {
    id: "react_paper",
    title: "ReAct: Synergizing Reasoning and Acting in Language Models",
    url: "https://arxiv.org/abs/2210.03629",
    priority: "must",
    type: "paper",
    instruction:
      "Read the method section and action/observation examples only. Focus on how reasoning traces and tool actions intertwine.",
    estimatedMinutes: 20,
  },
  tau_bench: {
    id: "tau_bench",
    title: "τ-bench: A Benchmark for Tool-Agent User-Interaction",
    url: "https://github.com/sierra-research/tau-bench",
    priority: "must",
    type: "repo",
    instruction:
      "Inspect the environment state, tool schema, user simulation loop, and state-based pass criteria.",
    estimatedMinutes: 20,
  },
  inspect_ai: {
    id: "inspect_ai",
    title: "Inspect AI Framework Documentation",
    url: "https://inspect.aisi.org.uk/",
    priority: "must",
    type: "docs",
    instruction:
      "Inspect how datasets, task solvers, tools, scorers, and sandboxes are structured cleanly.",
    estimatedMinutes: 20,
  },
  webarena: {
    id: "webarena",
    title: "WebArena: A Realistic Web Environment for Agents",
    url: "https://webarena.dev/",
    priority: "should",
    type: "paper",
    instruction:
      "Read the environment verification and evaluation design sections to understand state vs execution metrics.",
    estimatedMinutes: 15,
  },
  cs336_stanford: {
    id: "cs336_stanford",
    title: "Stanford CS336: Language Modeling from Scratch",
    url: "https://cs336.stanford.edu/",
    priority: "must",
    type: "lecture",
    instruction:
      "Read resource-accounting and inference sections: parameter memory, activation memory, KV cache, prefill vs decode.",
    estimatedMinutes: 30,
  },
  cohere_data_eval_jd: {
    id: "cohere_data_eval_jd",
    title: "Cohere MTS Job Spec — Data Analysis & Evaluation",
    url: "https://cohere.com/careers",
    priority: "must",
    type: "job-description",
    instruction:
      "Extract exact technical skills, tooling, evaluation metrics, statistical methods, and systems expectations.",
    estimatedMinutes: 15,
  },
  cohere_agent_env_jd: {
    id: "cohere_agent_env_jd",
    title: "Cohere MTS Job Spec — Agentic Environments",
    url: "https://cohere.com/careers",
    priority: "must",
    type: "job-description",
    instruction:
      "Extract sandbox requirements, tool integration loops, execution environments, and validation procedures.",
    estimatedMinutes: 15,
  },
  dpo_paper: {
    id: "dpo_paper",
    title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
    url: "https://arxiv.org/abs/2305.18290",
    priority: "must",
    type: "paper",
    instruction:
      "Study the closed-form loss derivation, reference policy regularization, and contrast with standard PPO.",
    estimatedMinutes: 25,
  },
  grpo_deepseek: {
    id: "grpo_deepseek",
    title: "DeepSeekMath & DeepSeek-R1 GRPO Alignment",
    url: "https://arxiv.org/abs/2402.03300",
    priority: "must",
    type: "paper",
    instruction:
      "Focus on Group Relative Policy Optimization, rule-based reward verification, and reasoning test-time compute.",
    estimatedMinutes: 25,
  },
  pytorch_fsdp2: {
    id: "pytorch_fsdp2",
    title: "PyTorch FSDP2 & Distributed Training Guide",
    url: "https://pytorch.org/docs/stable/fsdp.html",
    priority: "must",
    type: "docs",
    instruction:
      "Inspect fully sharded data parallel state, forward/backward all-gather and reduce-scatter communication flows.",
    estimatedMinutes: 25,
  },
  vllm_docs: {
    id: "vllm_docs",
    title: "vLLM High-Throughput Serving Engine",
    url: "https://docs.vllm.ai/",
    priority: "must",
    type: "docs",
    instruction:
      "Review PagedAttention block table management, continuous batching scheduler, and memory allocation overheads.",
    estimatedMinutes: 20,
  },
  ray_core_docs: {
    id: "ray_core_docs",
    title: "Ray Distributed Execution Documentation",
    url: "https://docs.ray.io/en/latest/ray-core/walkthrough.html",
    priority: "must",
    type: "docs",
    instruction:
      "Review actor pools, object store lifecycle, remote task scheduling, and fault-tolerant worker handling.",
    estimatedMinutes: 20,
  },
  bootstrapping_ci: {
    id: "bootstrapping_ci",
    title: "Statistical Evaluation: Bootstrap Confidence Intervals",
    url: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/",
    priority: "must",
    type: "lecture",
    instruction:
      "Review empirical bootstrap resampling, paired difference significance testing, and sample size sizing.",
    estimatedMinutes: 20,
  },
  neetcode_practice: {
    id: "neetcode_practice",
    title: "NeetCode / LeetCode Structured Coding",
    url: "https://neetcode.io/",
    priority: "must",
    type: "exercise",
    instruction:
      "Pick 2 medium problems (no hints). State complexity upfront, test edge cases, and log every failure mode.",
    estimatedMinutes: 45,
  },
};

export function getResource(id: string): TaskResource {
  const resource = CURRICULUM_RESOURCES[id];
  if (!resource) {
    return {
      id,
      title: id,
      url: "#",
      priority: "should",
      type: "reference",
      instruction: "Review reference materials.",
      estimatedMinutes: 15,
    };
  }
  return resource;
}
