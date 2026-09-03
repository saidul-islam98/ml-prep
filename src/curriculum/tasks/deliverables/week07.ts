import type { TaskDeliverable, WeekDeliverable } from "../../schemas";

const d = (
  id: string,
  name: string,
  artifact: string,
  evidenceType: TaskDeliverable["evidenceType"],
  verify: string,
  required = true,
): TaskDeliverable => ({ id, name, artifact, evidenceType, verify, required });

export const WEEK_07_TASK_DELIVERABLES: Record<string, TaskDeliverable[]> = {
  "w07-mon": [
    d(
      "w07-mon-d1",
      "Two timed, fully reviewed solutions for the assigned problems",
      "Solution files plus review notes for Subarray Sum Equals K and Product of Array Except Self",
      "code",
      "Both problems solved within 40 minutes each with stated complexity; edge-case tests run; one miss re-solved from a blank page",
    ),
    d(
      "w07-mon-d2",
      "Mistake-log entries for every miss",
      "Mistake log appended with root-cause categories",
      "note",
      "Each miss classified and one correction scheduled within 7 days",
    ),
  ],
  "w07-tue": [
    d(
      "w07-tue-d1",
      "Written derivations: attention, causal masking, cross-entropy, normalization, KV-cache",
      "Derivation notes with shapes and memory formulas",
      "note",
      "Each mechanism derived by hand; KV-cache memory and latency worked example with explicit shapes",
    ),
  ],
  "w07-wed": [
    d(
      "w07-wed-d1",
      "Systems concepts notes: tokenization through memory vs compute",
      "Notes covering positional methods, batching, quantization, speculative decoding, bandwidth vs compute bounds",
      "note",
      "Every concept explained with one quantified example or estimate",
    ),
  ],
  "w07-thu": [
    d(
      "w07-thu-d1",
      "Project 2 load-test matrix",
      "Load-test results: 3 concurrency levels x 2 batching settings",
      "benchmark",
      "Results table records tokens/s, p50/p95 latency, and failure rate for every cell; run reproducible from committed config",
    ),
  ],
  "w07-fri": [
    d(
      "w07-fri-d1",
      "vLLM results connected to mechanisms",
      "Analysis note",
      "note",
      "Measured throughput/latency explained via batching, KV-cache, and memory-bandwidth mechanisms, not generic claims",
    ),
  ],
  "w07-sat": [
    d(
      "w07-sat-d1",
      "Project 2 profiling evidence",
      "Profiler trace summary with bottleneck hypothesis",
      "benchmark",
      "torch.profiler trace separates compute, synchronization, and I/O; bottleneck hypothesis stated from measurements",
    ),
  ],
  "w07-sun": [
    d(
      "w07-sun-d1",
      "Inference-system design mock",
      "Mock recording and score sheet",
      "recording",
      "45-minute mock recorded and scored on the rubric; every miss logged with a repair action",
    ),
  ],
  "w07-sun-review": [
    d(
      "w07-sun-review-d1",
      "Week 7 scorecard",
      "Weekly review note",
      "note",
      "Planned vs completed minutes recorded; exit check audited against linked evidence; one repair action scheduled",
    ),
  ],
};

export const WEEK_07_EVIDENCE_REQUIRED_TASK_KEYS: string[] = ["w07-sun-review"];

export const WEEK_07_WEEK_DELIVERABLES: WeekDeliverable[] = [
  {
    id: "wk-07-d1",
    name: "Load-test matrix with profiling evidence",
    fromTaskKeys: ["w07-thu", "w07-sat"],
    verify:
      "3 concurrency x 2 batching results with tokens/s and p50/p95; profiler trace separates compute, sync, and I/O with a stated bottleneck",
  },
  {
    id: "wk-07-d2",
    name: "Whiteboard-ready LLM systems derivations",
    fromTaskKeys: ["w07-tue", "w07-wed", "w07-fri"],
    verify:
      "Attention, masking, cross-entropy, normalization, KV-cache, and inference concepts derived with quantified examples",
  },
  {
    id: "wk-07-d3",
    name: "Inference-system design mock completed",
    fromTaskKeys: ["w07-sun"],
    verify: "Recorded and scored; misses logged with a repair action",
  },
];
