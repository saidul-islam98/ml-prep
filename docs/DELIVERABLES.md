# Deliverables: concrete, verifiable artifacts for every task

Status: implemented across all 14 weeks (109 required tasks plus the 9 optional
Post-Training tasks).

Every curriculum task now defines one to three **structured deliverables**.
A deliverable is not a vague instruction - it names the artifact, states what
and where it is, and gives the objective check that proves it is done.

## Data model (`src/curriculum/schemas.ts`)

```ts
interface TaskDeliverable {
  id: string; // stable: `${taskKey}-d1`
  name: string; // what the artifact is
  artifact: string; // where it lives: "git tag v0.1 + release notes"
  evidenceType: EvidenceType;
  verify: string; // the objective check that makes it verifiable
  required: boolean; // false = nice-to-have
}

interface WeekDeliverable {
  id: string; // `wk-05-d1`
  name: string; // week-level rollup of task deliverables
  fromTaskKeys: string[]; // provenance, validated against template keys
  verify: string;
}
```

Evidence types: `note`, `code`, `commit`, `notebook`, `benchmark`, `diagram`,
`resume-diff`, `screenshot`, `recording`, `report`, `application`, `file`.

## Where content lives

- `src/curriculum/tasks/week01.ts` - the handcrafted week; deliverables inline.
- `src/curriculum/tasks/deliverables/weekNN.ts` - per-task deliverables, the
  week-level rollup, and the week's evidence-required task keys. A future full
  `weekNN.ts` execution rewrite absorbs its deliverables module.
- `src/curriculum/tasks/deliverables/index.ts` - aggregation.

## Tiered evidence enforcement

`evidenceRequired` is authored per task (32 tasks). When true, the completion
gate blocks completion until evidence is present: an HTTPS link, a note, or
both. Flagged tasks: both application submissions, the weekly reviews, the
Project 1 v0.1 release, the week 10 CI regression gate, the week 11 report,
all week 12-14 mocks and loop days, the final readiness reviews, and
`pt-w14-final`. Routine practice and study tasks keep the criteria-based gate
with evidence optional. As with `completion_gate_verified`, the server records
the completion assertion in the audit event; the gate check itself is
client-side, so no migration is required.

## Evidence storage

Evidence (links and notes) lives only in Supabase (`tasks.evidence_url`,
`tasks.evidence_note`) per the privacy rules in `WEBAPP_SPEC.md`. The public
repository never stores personal progress or evidence artifacts.

## Coding problems

`src/curriculum/codingProblems.ts` imports the 60 unique LeetCode problems from
the owner's Brave bookmarks (66 bookmark entries minus two cross-list
duplicates, three problem-list pages, and the site root) and assigns them
deterministically:

- `w01-mon` baseline: 2 problems (one sliding-window, one grid DFS).
- `w02-mon` .. `w10-mon`: 2 problems per Monday session (18).
- Recorded coding mocks `w11-mon`, `w11-wed`, `w12-mon`, `w13-mon`, `w14-mon`:
  1 problem each (5).
- The remaining 35 problems form `CODING_PROBLEM_BACKLOG_IDS`, exported for
  manual selection during week 13 targeted repair and maintenance mode (no
  feature consumes it yet).

Assigned problems attach to their task as `exercise` resources - via
`resourcesFor()` for template-generated tasks, and via the handcrafted merge
branch in `allTasks.ts` for `w01-mon` - and are named explicitly in the task's
deliverables. Difficulty was verified against the LeetCode API at import time.
The difficulty ramps from sliding-window/hashing staples through binary search,
stacks, and greedy toward dynamic programming and backtracking, matching the
canonical plan's week-2 topic guidance.

## Tests that pin the invariants

- `tests/unit/curriculum.test.ts` - every task has deliverables with non-empty
  name/artifact/verify and valid evidence types; unique ids; every week has 2+
  week deliverables backed by real task keys; every evidence-required task has
  a required deliverable.
- `tests/unit/codingProblems.test.ts` - 60 unique problems, URL shape,
  assignment validity, no double assignment, documented 25/35 split.
- `tests/unit/completionGateEvidence.test.tsx` - the gate blocks
  evidence-required completions without a link or note, accepts either one,
  and leaves unflagged tasks unchanged.
