/**
 * Projects view (WEBAPP_SPEC.md section 6.4): project cards with budgets and
 * actual logged minutes, milestones with acceptance criteria and completion
 * gates, evidence links, blocker notes, and the server-locked optional
 * Post-Training track with its explicit time-budget tradeoff.
 */

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MilestoneRow, ProjectRow } from "../lib/api";

type ProjectUpdateFields = Parameters<ReturnType<typeof useApi>["updateProject"]>[1];
import { isTaskOptional } from "../lib/api";
import { TEMPLATE_V1 } from "../template/templateV1";
import { commandErrorMessage, isValidHttpsUrl } from "../lib/constants";
import { useApi } from "../hooks/useApi";
import { useProfile } from "../hooks/useProfile";
import { useTasks } from "../hooks/useTasks";

const ROLE_LABELS_SHORT: Record<string, string> = {
  data_eval: "Data/Eval",
  agent_env: "Agent Env",
  post_training: "Post-Training",
};

export function ProjectsView() {
  const api = useApi();
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useTasks();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.fetchProjects(),
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones"],
    queryFn: () => api.fetchMilestones(),
  });

  const postTrainingEnabled = profile?.post_training_enabled ?? false;

  const actualByProject = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of tasks) {
      if (!t.project_id || t.state !== "completed") continue;
      if (isTaskOptional(t) && !postTrainingEnabled) continue;
      totals[t.project_id] = (totals[t.project_id] ?? 0) + (t.actual_minutes ?? 0);
    }
    return totals;
  }, [tasks, postTrainingEnabled]);

  return (
    <div className="projects-view">
      <section aria-labelledby="projects-title">
        <h1 id="projects-title">Projects</h1>
        <p className="overdue-note">
          Agent Reliability Lab: two connected required projects, plus an optional post-training
          extension locked behind completion gates.
        </p>
      </section>

      {isLoading && <p role="status">Loading projects…</p>}

      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          projects={projects}
          milestones={milestones.filter((m) => m.project_id === project.id)}
          actualMinutes={actualByProject[project.id] ?? 0}
          postTrainingEnabled={postTrainingEnabled}
        />
      ))}
    </div>
  );
}

function projectPurpose(key: string): string {
  return TEMPLATE_V1.projects.find((p) => p.key === key)?.purpose ?? "";
}

function ProjectCard({
  project,
  projects,
  milestones,
  actualMinutes,
  postTrainingEnabled,
}: {
  project: ProjectRow;
  projects: ProjectRow[];
  milestones: MilestoneRow[];
  actualMinutes: number;
  postTrainingEnabled: boolean;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const locked = project.state === "locked";

  const saveProject = useMutation({
    mutationFn: (fields: ProjectUpdateFields) => api.updateProject(project.id, fields),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <section
      aria-labelledby={`project-${project.project_key}`}
      className={locked ? "project-card locked" : "project-card"}
    >
      <header>
        <h2 id={`project-${project.project_key}`}>
          {project.name}
          {locked && <span className="chip chip-locked">Locked - optional</span>}
        </h2>
        <p className="project-roles">
          {project.target_roles.map((r) => ROLE_LABELS_SHORT[r] ?? r).join(" + ")}
          {" - "}
          {Math.round(actualMinutes / 60)} of {Math.round(project.budget_minutes / 60)} h logged
        </p>
        <p className="project-purpose">{projectPurpose(project.project_key)}</p>
      </header>

      <MilestoneList milestones={milestones} locked={locked} />

      {!locked && (
        <ProjectEvidence project={project} onSave={(fields) => saveProject.mutate(fields)} />
      )}

      {locked ? (
        <UnlockPanel projects={projects} postTrainingEnabled={postTrainingEnabled} />
      ) : (
        <BlockerNote project={project} onSave={(fields) => saveProject.mutate(fields)} />
      )}
    </section>
  );
}

function MilestoneList({ milestones, locked }: { milestones: MilestoneRow[]; locked: boolean }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (input: {
      id: string;
      fields: { completed_at?: string | null; evidence_url?: string | null };
    }) => api.updateMilestone(input.id, input.fields),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["milestones"] }),
  });

  if (milestones.length === 0) return null;

  return (
    <ul className="milestone-list">
      {milestones.map((m) => (
        <li key={m.id} className={m.is_completion_gate ? "milestone gate" : "milestone"}>
          <label className="milestone-toggle">
            <input
              type="checkbox"
              checked={m.completed_at !== null}
              disabled={locked}
              onChange={(e) =>
                update.mutate({
                  id: m.id,
                  fields: { completed_at: e.target.checked ? new Date().toISOString() : null },
                })
              }
            />
            <span>
              {m.title}
              {m.is_completion_gate && <span className="chip chip-gate">completion gate</span>}
              {m.target_date ? <span className="chip">target {m.target_date}</span> : null}
            </span>
          </label>
          <p className="milestone-acceptance">{m.acceptance_criteria}</p>
          {!locked && (
            <MilestoneEvidence
              milestone={m}
              onSave={(fields) => update.mutate({ id: m.id, fields })}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function MilestoneEvidence({
  milestone,
  onSave,
}: {
  milestone: MilestoneRow;
  onSave: (fields: { completed_at?: string | null; evidence_url?: string | null }) => void;
}) {
  const [url, setUrl] = useState(milestone.evidence_url ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidHttpsUrl(url)) {
      setError("Evidence links must use HTTPS.");
      return;
    }
    setError(null);
    onSave({ evidence_url: url || null });
  }

  return (
    <form className="milestone-evidence" onSubmit={submit}>
      <label htmlFor={`m-ev-${milestone.id}`}>Evidence link (HTTPS)</label>
      <input
        id={`m-ev-${milestone.id}`}
        type="url"
        placeholder="https://"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      {error && (
        <p role="alert" className="task-error-text">
          {error}
        </p>
      )}
      <div className="task-actions">
        <button type="submit">Save evidence</button>
      </div>
    </form>
  );
}

function ProjectEvidence({
  project,
  onSave,
}: {
  project: ProjectRow;
  onSave: (fields: {
    repository_url?: string | null;
    design_url?: string | null;
    report_url?: string | null;
    demo_url?: string | null;
    state?: string;
  }) => void;
}) {
  const [urls, setUrls] = useState({
    repository_url: project.repository_url ?? "",
    design_url: project.design_url ?? "",
    report_url: project.report_url ?? "",
    demo_url: project.demo_url ?? "",
  });
  const [state, setState] = useState(project.state);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    for (const value of Object.values(urls)) {
      if (!isValidHttpsUrl(value)) {
        setError("Evidence links must use HTTPS.");
        return;
      }
    }
    setError(null);
    onSave({
      repository_url: urls.repository_url || null,
      design_url: urls.design_url || null,
      report_url: urls.report_url || null,
      demo_url: urls.demo_url || null,
      state,
    });
  }

  const fields: [keyof typeof urls, string][] = [
    ["repository_url", "Repository URL"],
    ["design_url", "Design document URL"],
    ["report_url", "Report URL"],
    ["demo_url", "Demo URL"],
  ];

  return (
    <form className="project-evidence" onSubmit={submit}>
      <h3>Project evidence and status</h3>
      {fields.map(([key, label]) => (
        <div key={key}>
          <label htmlFor={`p-${key}-${project.id}`}>{label}</label>
          <input
            id={`p-${key}-${project.id}`}
            type="url"
            placeholder="https://"
            value={urls[key]}
            onChange={(e) => setUrls({ ...urls, [key]: e.target.value })}
          />
        </div>
      ))}
      <label htmlFor={`p-state-${project.id}`}>Project status</label>
      <select id={`p-state-${project.id}`} value={state} onChange={(e) => setState(e.target.value)}>
        <option value="active">Active</option>
        <option value="at_risk">At risk</option>
        <option value="completed">Completed</option>
      </select>
      {error && (
        <p role="alert" className="task-error-text">
          {error}
        </p>
      )}
      <div className="task-actions">
        <button type="submit">Save project</button>
      </div>
    </form>
  );
}

function BlockerNote({
  project,
  onSave,
}: {
  project: ProjectRow;
  onSave: (fields: { blocker_note?: string | null }) => void;
}) {
  const [note, setNote] = useState(project.blocker_note ?? "");
  return (
    <div className="blocker-note">
      <label htmlFor={`p-blocker-${project.id}`}>Blocker note</label>
      <input
        id={`p-blocker-${project.id}`}
        type="text"
        placeholder="What is blocking this project right now?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => onSave({ blocker_note: note.trim() || null })}
      />
    </div>
  );
}

function UnlockPanel({
  projects,
  postTrainingEnabled,
}: {
  projects: ProjectRow[];
  postTrainingEnabled: boolean;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tasks = [] } = useTasks();
  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones"],
    queryFn: () => api.fetchMilestones(),
  });

  // Server rule (unlock_post_training): every completion-gate milestone of
  // the two REQUIRED projects must be completed with qualifying evidence.
  const requiredGateMilestones = useMemo(() => {
    const requiredProjectIds = new Set(
      projects.filter((p) => p.project_key !== "post_training_lab").map((p) => p.id),
    );
    return milestones.filter((m) => m.is_completion_gate && requiredProjectIds.has(m.project_id));
  }, [projects, milestones]);
  const gatesMet =
    requiredGateMilestones.length > 0 &&
    requiredGateMilestones.every((m) => m.completed_at !== null && m.evidence_url !== null);

  const swapMinutes = TEMPLATE_V1.tasks
    .filter((t) => t.swapGroup === "post_training")
    .reduce((sum, t) => sum + t.minutes, 0);
  const ptMinutes = TEMPLATE_V1.tasks
    .filter((t) => t.optionalTrack)
    .reduce((sum, t) => sum + t.minutes, 0);

  const openSwapTasks = tasks.filter(
    (t) =>
      t.template_task_key !== null &&
      TEMPLATE_SWAP_KEYS.includes(t.template_task_key) &&
      (t.state === "not_started" || t.state === "in_progress"),
  ).length;

  const unlock = useMutation({
    mutationFn: () => api.unlockPostTraining(true),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries();
    },
    onError: (err) => setError(unlockErrorMessage(err)),
  });

  if (postTrainingEnabled) {
    return (
      <div className="unlock-panel enabled">
        <p>
          {
            "Post-Training track enabled. Project 3 is active and its tasks are visible in Today and Plan. Enablement is one-way."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="unlock-panel" aria-labelledby="unlock-title">
      <h3 id="unlock-title">Enable the optional Post-Training track</h3>
      <ul className="unlock-conditions">
        <li>
          {gatesMet ? "Done:" : "Required:"} Project 1 and Project 2 completion gates pass with
          evidence.
        </li>
        <li>
          Swap: enabling activates {ptMinutes} min (Project 3) and permanently deactivates{" "}
          {swapMinutes} min of mapped theory/contingency work
          {openSwapTasks < TEMPLATE_SWAP_KEYS.length
            ? " - some mapped tasks are already resolved, so unlock is refused to protect the 196-hour cap."
            : "."}
        </li>
        <li>One-way in MVP: it cannot be disabled afterwards.</li>
      </ul>
      <label className="unlock-optin">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />I
        understand the time-budget tradeoff and explicitly enable Post-Training as a target.
      </label>
      {error && (
        <p role="alert" className="task-error-text">
          {error}
        </p>
      )}
      <div className="task-actions">
        <button type="button" disabled={!optIn} onClick={() => unlock.mutate()}>
          {unlock.isPending ? "Enabling…" : "Enable Post-Training"}
        </button>
      </div>
    </div>
  );
}

const TEMPLATE_SWAP_KEYS = TEMPLATE_V1.tasks
  .filter((t) => t.swapGroup === "post_training")
  .map((t) => t.key);

function unlockErrorMessage(err: unknown): string {
  const kind = (err as { kind?: string })?.kind ?? (err as Error)?.message?.split(":")[0];
  switch (kind) {
    case "gates_not_met":
      return "Unlock is rejected until both required projects' completion gates have evidence.";
    case "swap_unavailable":
      return "Some mapped theory/contingency tasks are already resolved. The exact 196-hour swap is no longer possible, so unlock is refused.";
    case "already_enabled":
      return "The Post-Training track is already enabled (one-way).";
    case "opt_in_required":
      return "Explicit opt-in is required.";
    default:
      return commandErrorMessage(err);
  }
}
