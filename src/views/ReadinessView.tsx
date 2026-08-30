/**
 * Readiness view (WEBAPP_SPEC.md section 6.6): role-specific, evidence-based
 * gate assessments for Data/Eval, Agent Environments, and the optional
 * Post-Training track. Gates are explicit user assessments with a note or
 * HTTPS evidence link - never an inferred composite score.
 */

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReadinessGateRow } from "../lib/api";
import { commandErrorMessage, isValidHttpsUrl } from "../lib/constants";
import { useApi } from "../hooks/useApi";
import { useProfile } from "../hooks/useProfile";
import { Badge, Button, Card, PageHeader, SkeletonRows } from "../components/ui";

const ROLE_CARDS: { key: ReadinessGateRow["role_key"]; label: string; note: string }[] = [
  {
    key: "data_eval",
    label: "MTS, Data Analysis and Evaluation",
    note: "Primary target. Interview-ready when resume, evaluation, research, Project 1, and behavioral gates pass.",
  },
  {
    key: "agent_env",
    label: "MTS, Agent Environments",
    note: "Primary stretch. Interview-ready when coding, systems, Project 2, and behavioral gates pass.",
  },
  {
    key: "post_training",
    label: "MTS, Post-Training",
    note: "Optional. Go only with documented training-loop ownership and held-out Project 3 evidence.",
  },
];

const STATES: ReadinessGateRow["state"][] = ["not_assessed", "in_progress", "ready", "at_risk"];

const STATE_LABELS: Record<ReadinessGateRow["state"], string> = {
  not_assessed: "Not assessed",
  in_progress: "In progress",
  ready: "Ready",
  at_risk: "At risk",
};

export function ReadinessView() {
  const api = useApi();
  const { data: profile } = useProfile();
  const { data: gates = [], isLoading } = useQuery({
    queryKey: ["readiness-gates"],
    queryFn: () => api.fetchReadinessGates(),
  });

  const postTrainingEnabled = profile?.post_training_enabled ?? false;
  const byRole = useMemo(() => {
    const map: Record<string, ReadinessGateRow[]> = {};
    for (const gate of gates) {
      map[gate.role_key] = map[gate.role_key] ?? [];
      map[gate.role_key].push(gate);
    }
    return map;
  }, [gates]);

  return (
    <div className="readiness-view">
      <PageHeader
        title="Readiness"
        description={
          <>
            Evidence-based gates, not a confidence score. Marking a gate ready requires a note or an
            HTTPS evidence link, and is always an explicit decision.
          </>
        }
      />

      {isLoading && <SkeletonRows label="Loading readiness gates" />}

      {ROLE_CARDS.map((role) => {
        const roleGates = byRole[role.key] ?? [];
        const readyCount = roleGates.filter((g) => g.state === "ready").length;
        const isOptional = role.key === "post_training";
        if (isOptional && !postTrainingEnabled && roleGates.length === 0) {
          return null;
        }
        return (
          <Card key={role.key} className="readiness-role" ariaLabel={`${role.label} readiness`}>
            <div className="readiness-role__header">
              <div>
                <h2 id={`role-${role.key}`}>{role.label}</h2>
                <p className="overdue-note">{role.note}</p>
              </div>
              <div className="readiness-role__badges">
                {isOptional ? <Badge tone="warning">Optional</Badge> : null}
                <Badge
                  tone={
                    readyCount === roleGates.length && roleGates.length > 0 ? "success" : "accent"
                  }
                >
                  {readyCount}/{roleGates.length} ready
                </Badge>
              </div>
            </div>
            {roleGates.length > readyCount ? (
              <p className="readiness-role__blocker">
                Next gate: {roleGates.find((gate) => gate.state !== "ready")?.title}
              </p>
            ) : null}
            {roleGates.map((gate) => (
              <GateRow key={gate.id} gate={gate} />
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function GateRow({ gate }: { gate: ReadinessGateRow }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ReadinessGateRow["state"]>(gate.state);
  const [note, setNote] = useState(gate.evidence_note ?? "");
  const [url, setUrl] = useState(gate.evidence_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      api.updateReadinessGate(gate.id, {
        state,
        evidence_note: note.trim() || null,
        evidence_url: url || null,
        assessed_at: state === "not_assessed" ? null : new Date().toISOString(),
      }),
    onSuccess: () => {
      setSaved(true);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["readiness-gates"] });
    },
    onError: (err) => setError(commandErrorMessage(err)),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    setError(null);
    if (state === "ready" && !note.trim() && !url) {
      setError("Marking a gate ready requires a note or an HTTPS evidence link.");
      return;
    }
    if (url && !isValidHttpsUrl(url)) {
      setError("Evidence links must use HTTPS.");
      return;
    }
    save.mutate();
  }

  return (
    <form className="task-card gate-row" onSubmit={submit} aria-label={`Gate: ${gate.title}`}>
      <div className="gate-row__summary">
        <div>
          <h3 className="task-title">{gate.title}</h3>
          <p className="task-state" data-state={gate.state}>
            {STATE_LABELS[gate.state]}
            {gate.assessed_at
              ? ` · assessed ${new Date(gate.assessed_at).toLocaleDateString("en-CA", { timeZone: "America/Toronto" })}`
              : ""}
          </p>
        </div>
        <Button small onClick={() => setOpen((value) => !value)}>
          {open ? "Close assessment" : "Assess gate"}
        </Button>
      </div>
      {open ? (
        <div className="gate-row__editor">
          <label htmlFor={`gate-state-${gate.id}`}>Assessment</label>
          <select
            id={`gate-state-${gate.id}`}
            value={state}
            onChange={(e) => setState(e.target.value as ReadinessGateRow["state"])}
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_LABELS[s]}
              </option>
            ))}
          </select>
          <label htmlFor={`gate-note-${gate.id}`}>Evidence note</label>
          <input
            id={`gate-note-${gate.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <label htmlFor={`gate-url-${gate.id}`}>Evidence link (HTTPS)</label>
          <input
            id={`gate-url-${gate.id}`}
            type="url"
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {error ? (
            <p role="alert" className="task-error-text">
              {error}
            </p>
          ) : null}
          <div className="task-actions">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save assessment"}
            </Button>
          </div>
        </div>
      ) : null}
      {saved ? (
        <p role="status" className="overdue-note">
          Saved.
        </p>
      ) : null}
    </form>
  );
}
