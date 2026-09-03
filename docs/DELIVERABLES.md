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

Every required deliverable now has its own persisted verification checkbox in
the completion gate. Its stable `deliverable:<id>` key is stored in the
existing synced execution-progress record. `evidenceRequired` remains tiered:
for the 32 flagged tasks, every required deliverable also needs a concrete
repository path, commit, report section, recording, or submission reference.
Routine practice and study tasks require explicit deliverable verification but
keep the per-deliverable reference optional. Unchecked required controls can
only pass with an audited override reason. Evidence cannot be cleared from a
completed evidence-required task until the task is reopened, which records the
state transition. No migration is required.

## Evidence storage

Task-level evidence lives in Supabase (`tasks.evidence_url`,
`tasks.evidence_note`); per-deliverable verification and references live in the
existing Supabase execution-progress JSON fields. Under the privacy rules in
`WEBAPP_SPEC.md`, the public
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
- Five backlog problems are explicit flex targets, bringing the tracked core
  target to 30 without adding study hours; they are planned inside targeted
  repair or replacement coding time.
- The complete 60-problem bank is searchable in Practice. Any problem can create
  a synced timed attempt; completed attempts retain duration, result, review
  notes, mistake category, and re-solve status.

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
  assignment validity, no double assignment, and the 25 fixed + 5 flex core target.
- `tests/unit/completionGateEvidence.test.tsx` - every required deliverable has
  an explicit persisted verification control; flagged tasks require a concrete
  reference for each artifact, while unflagged references remain optional.
- `tests/unit/practiceView.test.tsx` and `tests/unit/practice.test.ts` - all 60
  problems render and create stable synced attempts; only reviewed completions
  enter the latest-ten readiness window, and re-solves are tracked.
