/**
 * Practice view (WEBAPP_SPEC.md section 6.5): coding sessions with results
 * and mistake categories, mock interviews with the normalized eight-dimension
 * rubric (1-5), and dated correction tasks linked owner-safely to their
 * source session. Readiness uses the latest ten qualifying coding sessions,
 * never lifetime volume.
 */

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PracticeSessionRow, PrepApi } from "../lib/api";
import {
  MOCK_DIMENSIONS,
  MOCK_DIMENSION_LABELS,
  codingGateSummary,
  latestTenQualifyingCodingSessions,
} from "../lib/practice";
import { commandErrorMessage, isValidHttpsUrl } from "../lib/constants";
import { torontoToday, formatDisplayDate } from "../lib/toronto";
import { useApi } from "../hooks/useApi";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  SkeletonRows,
} from "../components/ui";

const MISTAKE_CATEGORIES = [
  "knowledge",
  "reasoning",
  "coding",
  "communication",
  "time_management",
] as const;

export function PracticeView() {
  const api = useApi();
  const queryClient = useQueryClient();
  const today = torontoToday();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["practice-sessions"],
    queryFn: () => api.fetchPracticeSessions(),
  });
  const { data: mockScores = [] } = useQuery({
    queryKey: ["mock-scores"],
    queryFn: () => api.fetchMockScores(),
  });

  const [showCodingForm, setShowCodingForm] = useState(false);
  const [showMockForm, setShowMockForm] = useState(false);
  const [activePanel, setActivePanel] = useState<"coding" | "mock">("coding");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["practice-sessions"] });
    void queryClient.invalidateQueries({ queryKey: ["mock-scores"] });
  };

  const create = useMutation({
    mutationFn: api.createPracticeSession,
    onSuccess: () => {
      setShowCodingForm(false);
      setShowMockForm(false);
      invalidate();
    },
  });
  const update = useMutation({
    mutationFn: (input: { id: string; fields: Parameters<PrepApi["updatePracticeSession"]>[1] }) =>
      api.updatePracticeSession(input.id, input.fields),
    onSettled: invalidate,
  });
  const saveScore = useMutation({
    mutationFn: (input: { sessionId: string; dimension: string; score: number }) =>
      api.saveMockScore(input.sessionId, input.dimension, input.score),
    onSettled: invalidate,
  });
  const createCorrection = useMutation({
    mutationFn: api.createCorrectionTask,
    onSettled: invalidate,
  });

  const latestTen = useMemo(() => latestTenQualifyingCodingSessions(sessions), [sessions]);
  const gate = codingGateSummary(latestTen);
  const codingSessions = useMemo(
    () => sessions.filter((session) => session.session_type === "coding"),
    [sessions],
  );
  const mockSessions = useMemo(
    () => sessions.filter((session) => session.session_type === "mock"),
    [sessions],
  );
  const scoresBySession = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const s of mockScores) {
      map[s.practice_session_id] = map[s.practice_session_id] ?? {};
      map[s.practice_session_id][s.dimension_key] = s.score;
    }
    return map;
  }, [mockScores]);

  function creationError(): string | null {
    return create.error ? commandErrorMessage(create.error) : null;
  }

  return (
    <div className="practice-view">
      <PageHeader
        title="Practice"
        description={
          <>
            Two reviewed coding sessions per week through Week 10, then mocks. The coding readiness
            gate reads the latest ten qualifying sessions - not lifetime volume.
          </>
        }
      >
        <Badge tone={gate.meetsGate ? "success" : "accent"}>
          {gate.solved}/{gate.total || 10} latest-ten solved
        </Badge>
      </PageHeader>

      <div className="practice-tabs" role="tablist" aria-label="Practice type">
        <button
          id="practice-tab-coding"
          type="button"
          role="tab"
          aria-selected={activePanel === "coding"}
          aria-controls="practice-panel-coding"
          className={activePanel === "coding" ? "practice-tab is-active" : "practice-tab"}
          onClick={() => setActivePanel("coding")}
        >
          Coding
        </button>
        <button
          id="practice-tab-mock"
          type="button"
          role="tab"
          aria-selected={activePanel === "mock"}
          aria-controls="practice-panel-mock"
          className={activePanel === "mock" ? "practice-tab is-active" : "practice-tab"}
          onClick={() => setActivePanel("mock")}
        >
          Mocks
        </button>
      </div>

      {activePanel === "coding" ? (
        <section id="practice-panel-coding" role="tabpanel" aria-labelledby="practice-tab-coding">
          <Card className="practice-gate" ariaLabel="Coding readiness summary">
            <div className="practice-gate__header">
              <div>
                <h2>Coding readiness</h2>
                <p className="overdue-note">Latest ten qualifying sessions · target: 8 solved</p>
              </div>
              <strong>
                {gate.solved}/{gate.total || 10}
              </strong>
            </div>
            <ProgressBar
              value={gate.solved}
              max={10}
              label="Solved coding sessions in latest ten"
              tone={gate.meetsGate ? "success" : "accent"}
            />
            {latestTen.length === 0 ? (
              <EmptyState title="Build your readiness window">
                Complete coding sessions with a recorded result to populate the latest ten.
              </EmptyState>
            ) : (
              <>
                <p className="practice-gate__copy">
                  {gate.meetsGate
                    ? "The latest ten meet the 8-of-10 gate signal."
                    : `${Math.max(0, 8 - gate.solved)} more solved result${gate.solved === 7 ? "" : "s"} needed to reach the signal.`}
                </p>
                <ol
                  className="latest-ten practice-result-cells"
                  aria-label="Latest ten coding results"
                >
                  {latestTen.map((session, index) => {
                    const solved =
                      session.result?.toLowerCase().includes("solved") &&
                      !session.result?.toLowerCase().includes("unsolved");
                    return (
                      <li
                        key={session.id}
                        className={
                          solved
                            ? "practice-result-cell is-solved"
                            : "practice-result-cell is-unsolved"
                        }
                        aria-label={`Coding result ${index + 1}: ${session.result ?? "not recorded"}, ${formatDisplayDate(session.date)}`}
                      >
                        <span aria-hidden="true">{solved ? "✓" : "×"}</span>
                        <span className="practice-result-cell__number">{index + 1}</span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </Card>

          <section className="practice-panel__section" aria-labelledby="coding-sessions">
            <div className="practice-panel__heading">
              <div>
                <h2 id="coding-sessions">Coding sessions</h2>
                <p>{codingSessions.length} recorded</p>
              </div>
              <Button onClick={() => setShowCodingForm((show) => !show)}>
                {showCodingForm ? "Close form" : "Log coding session"}
              </Button>
            </div>

            {showCodingForm && (
              <SessionForm
                kind="coding"
                today={today}
                pending={create.isPending}
                error={creationError()}
                onSubmit={async (input) => {
                  await create.mutateAsync(input);
                }}
              />
            )}
            {isLoading && <SkeletonRows label="Loading coding sessions" />}
            {codingSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                scores={null}
                onUpdate={(fields) => update.mutate({ id: s.id, fields })}
                onCreateCorrection={(input) => createCorrection.mutateAsync(input)}
                correctionError={
                  createCorrection.error ? commandErrorMessage(createCorrection.error) : null
                }
              />
            ))}
          </section>
        </section>
      ) : (
        <section id="practice-panel-mock" role="tabpanel" aria-labelledby="practice-tab-mock">
          <section className="practice-panel__section" aria-labelledby="mock-sessions">
            <div className="practice-panel__heading">
              <div>
                <h2 id="mock-sessions">Mock interviews</h2>
                <p>{mockSessions.length} recorded · score the eight dimensions after completion.</p>
              </div>
              <Button onClick={() => setShowMockForm((show) => !show)}>
                {showMockForm ? "Close form" : "Log mock interview"}
              </Button>
            </div>

            {showMockForm && (
              <SessionForm
                kind="mock"
                today={today}
                pending={create.isPending}
                error={creationError()}
                onSubmit={async (input) => {
                  await create.mutateAsync(input);
                }}
              />
            )}
            {isLoading && <SkeletonRows label="Loading mock interviews" />}
            {!isLoading && mockSessions.length === 0 ? (
              <EmptyState title="Your mock interviews will appear here">
                Log a mock interview when you are ready to assess the rubric.
              </EmptyState>
            ) : null}
            {mockSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                scores={scoresBySession[s.id] ?? {}}
                onScore={(dimension, score) =>
                  saveScore.mutate({ sessionId: s.id, dimension, score })
                }
                onUpdate={(fields) => update.mutate({ id: s.id, fields })}
                onCreateCorrection={(input) => createCorrection.mutateAsync(input)}
                correctionError={
                  createCorrection.error ? commandErrorMessage(createCorrection.error) : null
                }
              />
            ))}
          </section>
        </section>
      )}
    </div>
  );
}

function SessionForm({
  kind,
  today,
  pending,
  error,
  onSubmit,
}: {
  kind: "coding" | "mock";
  today: string;
  pending: boolean;
  error: string | null;
  onSubmit: (input: {
    session_type: "coding" | "mock";
    date: string;
    topic: string;
    allotted_minutes: number;
    notes: string | null;
    evidence_url: string | null;
  }) => Promise<void>;
}) {
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(kind === "coding" ? "90" : "60");
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = topic.trim();
    const allotted = Number(minutes);
    if (!trimmed) {
      setValidationError("A topic is required.");
      return;
    }
    if (!Number.isInteger(allotted) || allotted <= 0) {
      setValidationError("Allotted minutes must be a positive whole number.");
      return;
    }
    if (!isValidHttpsUrl(evidence)) {
      setValidationError("Evidence links must use HTTPS.");
      return;
    }
    setValidationError(null);
    await onSubmit({
      session_type: kind,
      date,
      topic: trimmed,
      allotted_minutes: allotted,
      notes: notes.trim() || null,
      evidence_url: evidence || null,
    });
    setTopic("");
    setNotes("");
    setEvidence("");
  }

  return (
    <form className="task-dialog" onSubmit={(e) => void submit(e)}>
      <h3>{kind === "coding" ? "New coding session" : "New mock interview"}</h3>
      <label htmlFor={`s-topic-${kind}`}>{kind === "mock" ? "Mock type and topic" : "Topic"}</label>
      <input
        id={`s-topic-${kind}`}
        value={topic}
        placeholder={kind === "mock" ? "System design: eval platform" : "Graph traversal"}
        onChange={(e) => setTopic(e.target.value)}
      />
      <label htmlFor={`s-date-${kind}`}>Date</label>
      <input
        id={`s-date-${kind}`}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <label htmlFor={`s-minutes-${kind}`}>Allotted minutes</label>
      <input
        id={`s-minutes-${kind}`}
        type="number"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
      />
      <label htmlFor={`s-notes-${kind}`}>Notes (optional)</label>
      <input id={`s-notes-${kind}`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <label htmlFor={`s-evidence-${kind}`}>Evidence link (optional, HTTPS)</label>
      <input
        id={`s-evidence-${kind}`}
        type="url"
        placeholder="https://"
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
      />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      {error && (
        <p role="alert" className="task-error-text">
          {error}
        </p>
      )}
      <div className="task-actions">
        <button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save session"}
        </button>
      </div>
    </form>
  );
}

function SessionCard({
  session,
  scores,
  onScore,
  onUpdate,
  onCreateCorrection,
  correctionError,
}: {
  session: PracticeSessionRow;
  scores: Record<string, number> | null;
  onScore?: (dimension: string, score: number) => void;
  onUpdate: (fields: Parameters<PrepApi["updatePracticeSession"]>[1]) => void;
  onCreateCorrection: (input: {
    title: string;
    scheduled_date: string;
    estimated_minutes: number;
    source_practice_session_id: string;
  }) => Promise<unknown>;
  correctionError: string | null;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const isMock = session.session_type === "mock";

  function completeWithResult(event: FormEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const elapsed = Number((form.elements.namedItem("elapsed") as HTMLInputElement).value);
    const result = (form.elements.namedItem("result") as HTMLInputElement).value.trim();
    const mistake = (form.elements.namedItem("mistake") as HTMLSelectElement).value;
    const correctionDue = (form.elements.namedItem("correction-due") as HTMLInputElement).value;
    if (!Number.isInteger(elapsed) || elapsed <= 0) {
      setCompletionError("Elapsed minutes must be a positive whole number.");
      return;
    }
    if (!result) {
      setCompletionError("A result is required.");
      return;
    }
    setCompletionError(null);
    onUpdate({
      state: "completed",
      completed_at: new Date().toISOString(),
      elapsed_minutes: elapsed,
      result,
      mistake_category: (mistake || null) as PracticeSessionRow["mistake_category"],
      correction_due_date: correctionDue || null,
    });
  }

  const correctionDate = session.correction_due_date ?? torontoToday();

  return (
    <article className="task-card" aria-label={`Session: ${session.topic}`}>
      <h3 className="task-title">{session.topic}</h3>
      <p className="task-meta">
        <span className="chip">{formatDisplayDate(session.date)}</span>
        <span className="chip">{session.allotted_minutes} min allotted</span>
        {session.elapsed_minutes && (
          <span className="chip">{session.elapsed_minutes} min actual</span>
        )}
        <span className="chip">{session.state}</span>
        {session.mistake_category && (
          <span className="chip chip-overdue">{session.mistake_category}</span>
        )}
      </p>
      {session.result && <p className="task-acceptance">Result: {session.result}</p>}
      {session.evidence_url && (
        <p className="task-evidence">
          <a href={session.evidence_url} target="_blank" rel="noopener noreferrer">
            {session.evidence_url}
          </a>
        </p>
      )}

      {session.state !== "completed" && session.state !== "skipped" && (
        <form className="task-dialog" onSubmit={completeWithResult}>
          <h4>Record outcome</h4>
          <label htmlFor={`elapsed-${session.id}`}>Elapsed minutes</label>
          <input id={`elapsed-${session.id}`} name="elapsed" type="number" min="1" required />
          <label htmlFor={`result-${session.id}`}>Result (required for readiness)</label>
          <input
            id={`result-${session.id}`}
            name="result"
            placeholder="solved / solved with help / unsolved"
            required
          />
          <label htmlFor={`mistake-${session.id}`}>Mistake category (optional)</label>
          <select id={`mistake-${session.id}`} name="mistake" defaultValue="">
            <option value="">None</option>
            {MISTAKE_CATEGORIES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <label htmlFor={`correction-due-${session.id}`}>Correction due date (optional)</label>
          <input id={`correction-due-${session.id}`} name="correction-due" type="date" />
          <div className="task-actions">
            <button type="submit">Mark completed</button>
            <button type="button" onClick={() => onUpdate({ state: "abandoned" })}>
              Abandon
            </button>
          </div>
          {completionError && (
            <p role="alert" className="task-error-text">
              {completionError}
            </p>
          )}
        </form>
      )}

      {isMock && scores !== null && session.state === "completed" && (
        <div className="mock-scores">
          <h4>Rubric scores (1-5) — {Object.keys(scores).length}/8 recorded</h4>
          {MOCK_DIMENSIONS.map((dimension) => {
            const score = scores[dimension];
            const label = MOCK_DIMENSION_LABELS[dimension];
            return (
              <div
                key={dimension}
                className={
                  score !== undefined && score <= 2
                    ? "mock-score-row mock-score-row--low"
                    : "mock-score-row"
                }
              >
                <label htmlFor={`score-${session.id}-${dimension}`}>{label}</label>
                <select
                  id={`score-${session.id}-${dimension}`}
                  value={score ?? ""}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isInteger(value) && value >= 1 && value <= 5) {
                      onScore?.(dimension, value);
                    }
                  }}
                >
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {score !== undefined && score <= 2 ? (
                  <Button
                    small
                    onClick={() => {
                      void onCreateCorrection({
                        title: `Correction: ${label} — ${session.topic}`,
                        scheduled_date: correctionDate,
                        estimated_minutes: Math.max(30, Math.round(session.allotted_minutes / 2)),
                        source_practice_session_id: session.id,
                      });
                      setShowCorrection(true);
                    }}
                  >
                    Create correction for {label}
                  </Button>
                ) : null}
              </div>
            );
          })}
          {session.correction_due_date && !session.corrected_at && (
            <p className="overdue-note">
              Correction due {formatDisplayDate(session.correction_due_date)}
              {" - "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  void onCreateCorrection({
                    title: `Correction: ${session.topic}`,
                    scheduled_date: correctionDate,
                    estimated_minutes: Math.max(30, Math.round(session.allotted_minutes / 2)),
                    source_practice_session_id: session.id,
                  });
                  setShowCorrection(true);
                }}
              >
                create dated correction task
              </button>
            </p>
          )}
        </div>
      )}

      {correctionError && showCorrection && (
        <p role="alert" className="task-error-text">
          {correctionError}
        </p>
      )}
    </article>
  );
}
