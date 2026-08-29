# Source-to-template mapping manifest

Status: **SKELETON - authored in Task 6 before any seed data is implemented.**
This file is the reviewable coverage manifest required by `docs/WEBAPP_SPEC.md` §11
and `tasks/todo.md` Task 6. It must be complete and reconciled to exactly
196 active hours before Task 7 encodes the template v1 artifacts.

Sources (read together with this manifest):

- Narrative source: `/home/ivlr/Study/Job Search/cohere/COHERE_MTS_PREPARATION_PLAN.md`
  (authoritative for career content, dates, routines, projects, gates, workload, role alignment)
- Behavior source: `/home/ivlr/Study/Job Search/cohere/docs/WEBAPP_SPEC.md`
  (authoritative for application behavior, architecture, security, data semantics)
- Executable checklist: `tasks/todo.md` (repo-local synchronized copy)

Canonical window: **August 31 - December 6, 2026 (14 weeks), America/Toronto.**
Active budget: **196 hours** (14 weeks x 14 h). Optional Post-Training track:
18-22 h funded by an explicitly mapped swap of up to 12 theory hours and
8 contingency hours; enabling it must never raise active scope above 196 h.

## Manifest record contract

Every actionable source-plan item maps to one row with:

| Field                 | Meaning                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `source_ref`          | Source section/reference (e.g. "Weekly routine > Monday")                                        |
| `stable_key`          | Stable task/gate key, independent of DB UUID (e.g. `w03-mon-coding`)                             |
| `scheduled_date`      | Exact date in `America/Toronto`                                                                  |
| `week` / `workstream` | Plan week 1-14 and workstream (projects, coding, study, mocks, applications, review/contingency) |
| `role_tags`           | Applicable target roles (`data_eval`, `agent_env`, `post_training`)                              |
| `required`            | Required vs optional                                                                             |
| `estimated_minutes`   | Planned minutes                                                                                  |
| `acceptance`          | Acceptance/evidence criteria                                                                     |
| `relation`            | Project or practice relationship (project key, practice target)                                  |
| `fixed_deadline`      | true for immovable interview/application deadlines                                               |
| `post_training_swap`  | Replacement mapping when the optional track is enabled                                           |

Recurrence expansion rules: the default weekly routine expands into concrete
dated tasks for each of the 14 weeks; fixed interview/application deadlines
never shift; the minimum-viable-week routine is contingency guidance, not
pre-seeded tasks. Expected record counts and planned minutes are stated by
week and workstream and must reconcile to 196 hours.

## Coverage sections to be filled in Task 6

- [ ] Weekly routine expansion (14 weeks x Mon-Sun sessions)
- [ ] Weekly review and scorecard tasks
- [ ] Exit checks per week as explicit tasks/readiness items
- [ ] Applications and fixed deadlines (Data/Eval by Sep 6; Agentic Environments by Sep 8)
- [ ] Projects 1-3 scope, milestones, evidence, completion gates
- [ ] Coding practice targets (30 reviewed problems; latest-ten readiness predicate)
- [ ] Mock interviews and rubric dimensions (eight 1-5 dimensions)
- [ ] Readiness gates per role (resume, recruiter, coding, evaluation, systems, research, project 1, project 2, behavioral)
- [ ] Post-Training optional track, server-validated gates, and the exact theory/contingency swap keys
- [ ] Reconciliation table: expected counts and minutes by week and workstream = exactly 196 h
