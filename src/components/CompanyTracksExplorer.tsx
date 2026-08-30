/**
 * Company Tracks Explorer (Interview Prep Tracks):
 * Company-specific preparation tracks (Cohere, Anthropic, OpenAI, DeepMind, Jane Street, Meta)
 * with role tracks, paced syllabus breakdown, resume portfolio projects, and readiness criteria.
 */

import { useState, useEffect } from "react";
import { Badge, Button } from "./ui";

export interface CompanyTrack {
  id: string;
  company: string;
  role: string;
  tagline: string;
  description: string;
  hours: number;
  weeks: number;
  problemsCount: number;
  projectsCount: number;
  roles: string[];
  skills: string[];
  isActiveTrack?: boolean;
  tier: "Active Plan" | "Curriculum Available" | "Preview";
  projects: string[];
  color: string;
  accentBorder: string;
}

export const COMPANY_TRACKS: CompanyTrack[] = [
  {
    id: "cohere-mts",
    company: "Cohere",
    role: "Member of Technical Staff (MTS)",
    tagline: "Agent Reliability Lab & LLM Systems",
    description:
      "A complete 14-week role-specific curriculum for the Cohere MTS loop: 196 planned hours, 3 portfolio projects (Eval Harness, Agent Sandbox, Distributed Post-Training), 30 reviewed coding challenges, and 8-dimension mock interviews.",
    hours: 196,
    weeks: 14,
    problemsCount: 30,
    projectsCount: 3,
    roles: ["Data & Eval", "Agent Environments", "Post-Training / RL"],
    skills: ["Eval Harnesses", "Tool Sandboxes", "RLHF / DPO", "Distributed Training", "ML Theory"],
    isActiveTrack: true,
    tier: "Active Plan",
    projects: [
      "Project 1: LLM Evaluation Platform & Benchmark Harness",
      "Project 2: Sandbox Environment for Tool-Using LLM Agents",
      "Project 3: Distributed Post-Training / RLHF Lab (Unlockable)",
    ],
    color: "#f59e0b",
    accentBorder: "rgba(245, 158, 11, 0.4)",
  },
  {
    id: "anthropic-mle",
    company: "Anthropic",
    role: "Machine Learning Engineer (MLE)",
    tagline: "Safety, Alignment & Interpretability",
    description:
      "Targeted technical prep for the Anthropic MLE loop: scaling laws, sparse autoencoders (SAE) for mechanistic interpretability, tool orchestration with Claude, and constitutional AI evaluations.",
    hours: 200,
    weeks: 14,
    problemsCount: 32,
    projectsCount: 3,
    roles: ["Safety & Alignment", "Interpretability", "Agentic Systems"],
    skills: ["Sparse Autoencoders", "Constitutional AI", "Tool Use Agents", "Python/Rust Loops"],
    tier: "Curriculum Available",
    projects: [
      "SAE Feature Dictionary Extractor for Transformer MLP Layers",
      "Automated Red-Teaming & Constitutional AI Benchmark",
      "Multi-Turn MCP Agent Sandbox with Formal Tool Verifiers",
    ],
    color: "#d97706",
    accentBorder: "rgba(217, 119, 6, 0.4)",
  },
  {
    id: "openai-research",
    company: "OpenAI",
    role: "Research Scientist / MLE",
    tagline: "Reasoning Models, RL & Large Scale Pre-training",
    description:
      "Advanced preparation for OpenAI research loops: deep reinforcement learning (PPO, GRPO, PRM), test-time search compute, Triton kernel optimization, and Megatron-style 3D parallelism.",
    hours: 210,
    weeks: 14,
    problemsCount: 35,
    projectsCount: 3,
    roles: ["Reasoning Models", "Post-Training RL", "Distributed Systems"],
    skills: ["GRPO / Process Reward Models", "Triton FlashAttention", "3D Parallelism", "MCTS"],
    tier: "Curriculum Available",
    projects: [
      "Process Reward Model (PRM) with Step-Level Math Verification",
      "Custom Triton GPU Kernel for Fused Rotary Attention",
      "Distributed Data-Parallel & Tensor-Parallel Training Loop",
    ],
    color: "#10b981",
    accentBorder: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "deepmind-researcher",
    company: "Google DeepMind",
    role: "LLM Researcher & Systems Engineer",
    tagline: "Multimodal Gemini Architectures & JAX Clusters",
    description:
      "Technical curriculum covering Gemini-class multimodal architectures, JAX/Flax distributed training across TPU pods, algorithmic tree search, and memory-augmented reasoning networks.",
    hours: 195,
    weeks: 14,
    problemsCount: 30,
    projectsCount: 3,
    roles: ["Multimodal Architecture", "JAX / TPU Scaling", "Algorithmic Reasoning"],
    skills: ["JAX / Flax", "TPU Sharding (pjit)", "Vision Tokenizers", "Tree Search"],
    tier: "Curriculum Available",
    projects: [
      "JAX/Flax Transformer with Automated TPU Mesh Sharding",
      "Vision-Language Cross-Attention Adapter from Scratch",
      "Search-Guided LLM Reasoning with Value Function Guidance",
    ],
    color: "#38bdf8",
    accentBorder: "rgba(56, 189, 248, 0.4)",
  },
  {
    id: "jane-street-ml",
    company: "Jane Street",
    role: "Quantitative ML & Systems Engineer",
    tagline: "Ultra Low-Latency ML & Production CUDA",
    description:
      "Curriculum for quantitative ML systems: microsecond-scale model inference, high-throughput feature pipelines, custom C++ SIMD & CUDA kernels, and online streaming Bayesian estimators.",
    hours: 185,
    weeks: 14,
    problemsCount: 30,
    projectsCount: 3,
    roles: ["Low-Latency ML", "Quantitative Infrastructure", "High-Performance Systems"],
    skills: ["Microsecond Inference", "C++20 / SIMD", "CUDA Streams", "Online Learning"],
    tier: "Curriculum Available",
    projects: [
      "Zero-Allocation C++ Inference Engine for GBDT & Small Transformers",
      "High-Throughput Lock-Free Streaming Order Book Feature Store",
      "Custom FP8 / INT4 Quantized Matrix Multiplication Kernel",
    ],
    color: "#a855f7",
    accentBorder: "rgba(168, 85, 247, 0.4)",
  },
  {
    id: "meta-fair",
    company: "Meta (FAIR & GenAI)",
    role: "Llama Systems & GenAI Research",
    tagline: "Open-Source LLMs & PyTorch FSDP2 Scaling",
    description:
      "Deep dive into Llama architecture, PyTorch 2.0 FSDP2 distributed training, synthetic dataset generation pipelines, AWQ/GPTQ quantization, and high-throughput vLLM serving.",
    hours: 190,
    weeks: 14,
    problemsCount: 30,
    projectsCount: 3,
    roles: ["Llama Architectures", "PyTorch FSDP2", "Serving & Quantization"],
    skills: ["PyTorch 2.0 FSDP2", "vLLM / PagedAttention", "Synthetic Data", "AWQ / GPTQ"],
    tier: "Curriculum Available",
    projects: [
      "Complete Llama 3.2 Implementation with GQA & RoPE Scaling",
      "PyTorch FSDP2 + Activation Checkpointing 70B Training Rig",
      "High-Throughput Continuous Batching vLLM Engine Benchmark",
    ],
    color: "#f43f5e",
    accentBorder: "rgba(244, 63, 94, 0.4)",
  },
];

export function CompanyTracksExplorer({
  currentWeek,
  onSelectTrack,
}: {
  currentWeek?: { week_number: number; phase: string } | null;
  onSelectTrack?: (trackId: string) => void;
}) {
  const [selectedTrack, setSelectedTrack] = useState<CompanyTrack | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");

  useEffect(() => {
    if (!selectedTrack) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedTrack(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedTrack]);

  const filteredTracks =
    filterRole === "all"
      ? COMPANY_TRACKS
      : COMPANY_TRACKS.filter(
          (t) =>
            t.roles.some((r) => r.toLowerCase().includes(filterRole.toLowerCase())) ||
            t.skills.some((s) => s.toLowerCase().includes(filterRole.toLowerCase())),
        );

  return (
    <section className="deepml-prep-hero" aria-labelledby="deepml-hero-title">
      <div className="deepml-hero-header">
        <div className="deepml-kicker-row">
          <span className="deepml-kicker-badge">
            <span className="deepml-pulse-dot" />
            COMPANY-SPECIFIC INTERVIEW PREPARATION
          </span>
          <span className="deepml-kicker-tag">14-WEEK PACED TRACKS</span>
        </div>
        <h2 id="deepml-hero-title" className="deepml-hero-h1">
          Machine Learning Interview Tracks
        </h2>
        <p className="deepml-hero-subtitle">
          Pick a company, choose a role, and follow a paced curriculum. Build the resume projects
          that pass engineering screens, practice timed mock loops, and verify readiness before your
          interviews.
        </p>

        <div className="deepml-stats-strip">
          <div className="deepml-stat-chip">
            <span className="deepml-stat-num">14 Weeks</span>
            <span className="deepml-stat-label">Paced Curriculum</span>
          </div>
          <div className="deepml-stat-divider" />
          <div className="deepml-stat-chip">
            <span className="deepml-stat-num">196 Hours</span>
            <span className="deepml-stat-label">Total Time Budget</span>
          </div>
          <div className="deepml-stat-divider" />
          <div className="deepml-stat-chip">
            <span className="deepml-stat-num">3 Projects</span>
            <span className="deepml-stat-label">Portfolio Deliverables</span>
          </div>
          <div className="deepml-stat-divider" />
          <div className="deepml-stat-chip">
            <span className="deepml-stat-num">30 Problems</span>
            <span className="deepml-stat-label">Reviewed Challenges</span>
          </div>
          <div className="deepml-stat-divider" />
          <div className="deepml-stat-chip">
            <span className="deepml-stat-num">8 Dimensions</span>
            <span className="deepml-stat-label">Mock Interview Rubric</span>
          </div>
        </div>
      </div>

      <div className="deepml-tracks-filter-bar">
        <div className="deepml-filter-label">Filter by focus:</div>
        <div className="deepml-filter-pills">
          <button
            type="button"
            className={filterRole === "all" ? "deepml-pill is-active" : "deepml-pill"}
            onClick={() => setFilterRole("all")}
          >
            All Tracks ({COMPANY_TRACKS.length})
          </button>
          <button
            type="button"
            className={filterRole === "eval" ? "deepml-pill is-active" : "deepml-pill"}
            onClick={() => setFilterRole("eval")}
          >
            Eval & Data
          </button>
          <button
            type="button"
            className={filterRole === "agent" ? "deepml-pill is-active" : "deepml-pill"}
            onClick={() => setFilterRole("agent")}
          >
            Agent Systems
          </button>
          <button
            type="button"
            className={filterRole === "training" ? "deepml-pill is-active" : "deepml-pill"}
            onClick={() => setFilterRole("training")}
          >
            Post-Training & RL
          </button>
          <button
            type="button"
            className={filterRole === "systems" ? "deepml-pill is-active" : "deepml-pill"}
            onClick={() => setFilterRole("systems")}
          >
            Infra & Kernels
          </button>
        </div>
      </div>

      <div className="deepml-tracks-grid">
        {filteredTracks.map((track) => (
          <article
            key={track.id}
            className={
              track.isActiveTrack ? "deepml-track-card is-active-plan" : "deepml-track-card"
            }
            onClick={() => setSelectedTrack(track)}
          >
            <div className="deepml-track-card__top">
              <div className="deepml-track-brand">
                <div className="deepml-track-logo" data-track={track.id}>
                  {track.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="deepml-track-identity">
                  <h3 className="deepml-track-company">{track.company}</h3>
                  <p className="deepml-track-role">{track.role}</p>
                </div>
              </div>
              <Badge tone={track.isActiveTrack ? "warning" : "neutral"}>
                {track.isActiveTrack ? "Active Track" : track.tier}
              </Badge>
            </div>

            <p className="deepml-track-tagline">{track.tagline}</p>
            <p className="deepml-track-desc">{track.description}</p>

            <div className="deepml-track-skills">
              {track.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="deepml-skill-badge">
                  {skill}
                </span>
              ))}
            </div>

            <div className="deepml-track-footer">
              <div className="deepml-track-meta">
                <span className="deepml-meta-item">
                  <strong className="font-mono">{track.weeks}w</strong> ({track.hours}h)
                </span>
                <span className="deepml-meta-dot">·</span>
                <span className="deepml-meta-item">
                  <strong className="font-mono">{track.projectsCount}</strong> projects
                </span>
                <span className="deepml-meta-dot">·</span>
                <span className="deepml-meta-item">
                  <strong className="font-mono">{track.problemsCount}</strong> challenges
                </span>
              </div>
              <Button
                small
                variant={track.isActiveTrack ? "primary" : "secondary"}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTrack(track);
                  if (track.isActiveTrack && onSelectTrack) {
                    onSelectTrack(track.id);
                  }
                }}
              >
                {track.isActiveTrack ? "Open Workspace" : "View Curriculum"}
              </Button>
            </div>

            {track.isActiveTrack && currentWeek && (
              <div className="deepml-active-progress-banner">
                <span className="deepml-live-dot" />
                <span>
                  Current: <strong>Week {currentWeek.week_number}</strong> — {currentWeek.phase}
                </span>
              </div>
            )}
          </article>
        ))}
      </div>

      {selectedTrack && (
        <div
          className="deepml-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="track-modal-title"
          onClick={() => setSelectedTrack(null)}
        >
          <div className="deepml-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="deepml-modal-header">
              <div className="deepml-track-brand">
                <div className="deepml-track-logo" data-track={selectedTrack.id}>
                  {selectedTrack.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 id="track-modal-title" className="deepml-modal-title">
                    {selectedTrack.company} — {selectedTrack.role}
                  </h3>
                  <p className="deepml-track-tagline">{selectedTrack.tagline}</p>
                </div>
              </div>
              <button
                type="button"
                className="deepml-modal-close"
                aria-label="Close track details"
                onClick={() => setSelectedTrack(null)}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="deepml-modal-body">
              <p className="deepml-modal-lead">{selectedTrack.description}</p>

              <div className="deepml-modal-stats-grid">
                <div className="deepml-modal-stat-box">
                  <div className="stat-value">{selectedTrack.weeks} Weeks</div>
                  <div className="stat-label">Paced Duration</div>
                </div>
                <div className="deepml-modal-stat-box">
                  <div className="stat-value">{selectedTrack.hours} Hours</div>
                  <div className="stat-label">Total Time Budget</div>
                </div>
                <div className="deepml-modal-stat-box">
                  <div className="stat-value">{selectedTrack.projectsCount} Projects</div>
                  <div className="stat-label">Resume Artifacts</div>
                </div>
                <div className="deepml-modal-stat-box">
                  <div className="stat-value">{selectedTrack.problemsCount} Problems</div>
                  <div className="stat-label">Coding Sessions</div>
                </div>
              </div>

              <div className="deepml-modal-section">
                <h4>Core Target Roles & Nuances</h4>
                <div className="deepml-modal-role-tags">
                  {selectedTrack.roles.map((r) => (
                    <Badge key={r} tone="accent">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="deepml-modal-section">
                <h4>Resume Portfolio Projects (Screen Passing Deliverables)</h4>
                <ul className="deepml-modal-project-list">
                  {selectedTrack.projects.map((p, idx) => (
                    <li key={p}>
                      <span className="project-index">0{idx + 1}</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="deepml-modal-section">
                <h4>Technical Dimensions & Evaluation Criteria</h4>
                <div className="deepml-modal-skills-grid">
                  {selectedTrack.skills.map((s) => (
                    <div key={s} className="skill-box">
                      <span className="skill-check">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="deepml-modal-footer">
              <Button onClick={() => setSelectedTrack(null)}>Close Details</Button>
              {selectedTrack.isActiveTrack ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedTrack(null);
                    window.location.hash = "#/today";
                  }}
                >
                  Go to Today's Tasks
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedTrack(null);
                    window.location.hash = "#/plan";
                  }}
                >
                  Inspect Curriculum in Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
